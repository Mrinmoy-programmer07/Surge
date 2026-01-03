import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, Chain, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import SurgeGamingABI from "@/lib/abi/SurgeGaming.json";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { enqueueWalletTx } from "@/lib/tx-queue";
import { updateLeaderboardAfterGame } from "@/lib/firebase-admin";

// Mantle Sepolia chain config
const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    name: 'Mantle',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
});

// Chain configurations
const CHAIN_CONFIGS: Record<number, { chain: Chain; rpcUrl: string }> = {
  421614: {
    chain: arbitrumSepolia,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
  5003: {
    chain: mantleSepolia,
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
  },
};

const DEFAULT_CHAIN_ID = 421614;

// Backend wallet for oracle operations
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY as `0x${string}`;

const account = BACKEND_PRIVATE_KEY
  ? privateKeyToAccount(BACKEND_PRIVATE_KEY)
  : null;

// Helper to get clients for a specific chain
function getClients(chainId: number) {
  const config = CHAIN_CONFIGS[chainId] || CHAIN_CONFIGS[DEFAULT_CHAIN_ID];
  const contractAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES]
    || CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID as keyof typeof CONTRACT_ADDRESSES];

  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http(config.rpcUrl),
  });

  const walletClient = account
    ? createWalletClient({
      account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    })
    : null;

  return { publicClient, walletClient, contractAddress };
}

/**
 * POST /api/contract/declare-winner
 * Backend declares winner after both scores submitted
 * Now supports multichain via chainId parameter
 */
export async function POST(request: NextRequest) {
  try {
    const {
      matchId,
      winnerAddress,
      chainId = DEFAULT_CHAIN_ID, // NEW: Accept chainId
      offChainPlayer1,
      offChainPlayer2,
      offChainP1Score,
      offChainP2Score,
    } = await request.json();

    if (!matchId || !winnerAddress) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, winnerAddress" },
        { status: 400 }
      );
    }

    // Get chain-aware clients
    const { publicClient, walletClient, contractAddress } = getClients(chainId);
    const chainName = CHAIN_CONFIGS[chainId]?.chain.name || 'Unknown';

    if (!walletClient || !account) {
      return NextResponse.json(
        { error: "Backend wallet not configured" },
        { status: 500 }
      );
    }

    console.log(`🏆 Declaring winner for match ${matchId} on ${chainName} (chainId: ${chainId}): ${winnerAddress}`);
    console.log(`📍 Contract address: ${contractAddress}`);

    // Wait for scores to be confirmed on-chain
    const maxRetries = 20;
    const retryDelay = 2000;
    let matchData: any;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        matchData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SurgeGamingABI.abi,
          functionName: "getMatch",
          args: [matchId],
        });

        console.log(
          `🔍 Attempt ${attempt + 1}/${maxRetries} - On-chain match status:`,
          {
            player1Score: matchData.player1Score,
            player2Score: matchData.player2Score,
            status: matchData.status,
          }
        );

        // Check if match is Active (status 1)
        if (Number(matchData.status) !== 1) {
          console.log(`⚠️ Match is not active (status: ${matchData.status})`);
          if (Number(matchData.status) === 2) {
            return NextResponse.json({
              success: true,
              message: "Match already completed",
              winner: matchData.winner,
            });
          }
          return NextResponse.json(
            { error: `Match not in active state (status: ${matchData.status})` },
            { status: 400 }
          );
        }

        // Check scores
        const p1Score = Number(matchData.player1Score);
        const p2Score = Number(matchData.player2Score);

        if (p1Score > 0 || p2Score > 0) {
          console.log(`✅ Scores detected: P1=${p1Score}, P2=${p2Score}`);
          break;
        }

        attempt++;
        if (attempt < maxRetries) {
          console.log(`⏳ Waiting ${retryDelay}ms for scores...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      } catch (e: any) {
        console.error(`❌ Error reading match: ${e.message}`);
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }

    // Determine effective winner from on-chain data
    let effectiveWinner = winnerAddress as `0x${string}`;
    try {
      const latest: any = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: SurgeGamingABI.abi,
        functionName: "getMatch",
        args: [matchId],
      });
      const p1 = Number(latest.player1Score);
      const p2 = Number(latest.player2Score);
      if (p1 !== 0 || p2 !== 0) {
        if (p1 > p2) effectiveWinner = latest.player1 as `0x${string}`;
        else if (p2 > p1) effectiveWinner = latest.player2 as `0x${string}`;
        else effectiveWinner = "0x0000000000000000000000000000000000000000" as `0x${string}`;
        if (effectiveWinner.toLowerCase() !== winnerAddress.toLowerCase()) {
          console.warn(
            `⚠️ Overriding provided winner with on-chain inferred winner: ${effectiveWinner}`
          );
        }
      }
    } catch (e) {
      console.warn("⚠️ Could not re-read match before declareWinner", e);
    }

    // Gas settings - Mantle needs auto-estimation, Arbitrum can use fixed
    const baseGasPrice = await publicClient.getGasPrice();
    const gasPrice = (baseGasPrice * BigInt(12)) / BigInt(10); // +20%

    // Declare winner in smart contract
    const txConfig: any = {
      address: contractAddress as `0x${string}`,
      abi: SurgeGamingABI.abi,
      functionName: "declareWinner",
      args: [matchId, effectiveWinner],
      gasPrice,
    };

    // Only set gas limit for non-Mantle chains
    if (chainId !== 5003) {
      txConfig.gas = BigInt(1000000);
    }

    const hash = await enqueueWalletTx(async () =>
      walletClient.writeContract(txConfig)
    );

    console.log(`✅ Winner declared! Transaction hash: ${hash}`);

    // Wait until the transaction is mined
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      pollingInterval: 2000,
      timeout: 240000,
    });
    if (receipt.status !== "success") {
      console.error("❌ declareWinner tx failed on-chain", receipt);
      return NextResponse.json(
        { error: "declareWinner failed on-chain", txHash: hash },
        { status: 502 }
      );
    }

    // Verify match status after declaration
    try {
      let checks = 0;
      while (checks < 10) {
        const after: any = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SurgeGamingABI.abi,
          functionName: "getMatch",
          args: [matchId],
        });
        if (Number(after.status) !== 1) {
          console.log(
            `🔒 Match status after declareWinner: ${after.status} (expect Completed=2 or Draw=4)`
          );
          break;
        }
        await new Promise((r) => setTimeout(r, 1500));
        checks++;
      }
    } catch (e) {
      console.warn("⚠️ Unable to confirm post-declare status, continuing", e);
    }

    // Update local match store and Firebase
    try {
      const latestAfter: any = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: SurgeGamingABI.abi,
        functionName: "getMatch",
        args: [matchId],
      });

      // Post the refreshed on-chain match to our local API
      await fetch(`${request.nextUrl.origin}/api/matches/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player1: String(latestAfter.player1 || "").toLowerCase(),
          player2: String(latestAfter.player2 || "").toLowerCase(),
          player1Score: Number(latestAfter.player1Score || 0),
          player2Score: Number(latestAfter.player2Score || 0),
          status: "finished",
          winner: effectiveWinner,
        }),
      });
      console.log("🔁 Local match store updated with on-chain results");

      // Update Firebase leaderboard
      const isDraw = effectiveWinner === "0x0000000000000000000000000000000000000000";
      if (!isDraw) {
        const loserAddress = effectiveWinner.toLowerCase() === String(latestAfter.player1).toLowerCase()
          ? String(latestAfter.player2)
          : String(latestAfter.player1);

        const stakeWei = Number(latestAfter.stake || 0);
        const winnerPayout = (stakeWei * 2 * 0.75) / 1e18;

        await updateLeaderboardAfterGame(
          effectiveWinner,
          loserAddress,
          winnerPayout,
          false
        );
        console.log("📊 Firebase leaderboard updated!");
      } else {
        await updateLeaderboardAfterGame(
          String(latestAfter.player1),
          String(latestAfter.player2),
          0,
          true
        );
        console.log("📊 Firebase updated for draw match");
      }
    } catch (e) {
      console.warn("⚠️ Failed to update local match store or leaderboard:", e);
    }

    return NextResponse.json({
      success: true,
      txHash: hash,
      matchId,
      winner: effectiveWinner,
      chainId,
    });
  } catch (error: any) {
    console.error("❌ Error declaring winner:", error);
    return NextResponse.json(
      { error: error.message || "Failed to declare winner" },
      { status: 500 }
    );
  }
}
