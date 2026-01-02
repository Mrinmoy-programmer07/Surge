import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, Chain, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";
import SurgeGamingABI from "@/lib/abi/SurgeGaming.json";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { enqueueWalletTx } from "@/lib/tx-queue";

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
 * POST /api/contract/submit-score
 * Backend submits player score to smart contract
 * Now supports multichain via chainId parameter
 */
export async function POST(request: NextRequest) {
  try {
    const { matchId, playerAddress, score, chainId = DEFAULT_CHAIN_ID } = await request.json();

    if (!matchId || !playerAddress || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, playerAddress, score" },
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

    console.log(
      `📝 Submitting score on ${chainName} (chainId: ${chainId}) for match ${matchId}: Player ${playerAddress} scored ${score}`
    );
    console.log(`📍 Contract address: ${contractAddress}`);

    // First, check if match exists and is in Active status on-chain
    let matchData: any;
    try {
      matchData = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: SurgeGamingABI,
        functionName: "getMatch",
        args: [matchId],
      });

      console.log(`🔍 On-chain match status:`, matchData);
    } catch (readError: any) {
      console.error(
        `❌ Match ${matchId} does not exist on-chain yet:`,
        readError.message
      );
      return NextResponse.json(
        {
          error: "Match not yet confirmed on-chain",
          details:
            "Please wait for blockchain confirmation before submitting scores",
          shouldRetry: true,
        },
        { status: 425 }
      );
    }

    // Check if match is Active (status 1)
    if (matchData.status !== 1) {
      const statusNames = [
        "Pending",
        "Active",
        "Completed",
        "Cancelled",
        "Draw",
      ];
      console.warn(
        `⚠️ Match ${matchId} is not Active. Current status: ${statusNames[matchData.status] || matchData.status}`
      );

      if (matchData.status === 0) {
        return NextResponse.json(
          {
            error: "Match is still pending",
            details: "Waiting for second player to join",
            shouldRetry: true,
          },
          { status: 425 }
        );
      }

      return NextResponse.json(
        {
          error: `Match is ${statusNames[matchData.status] || "invalid status"}`,
        },
        { status: 400 }
      );
    }

    // Submit score to smart contract
    const normalizedScore = Math.max(1, Number(score)) & 0xff;

    const baseGasPrice = await publicClient.getGasPrice();
    const gasPrice = (baseGasPrice * BigInt(12)) / BigInt(10);

    // Gas config - Mantle needs auto-estimation
    const txConfig: any = {
      address: contractAddress as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "submitScore",
      args: [matchId, playerAddress, normalizedScore],
      gasPrice,
    };

    // Only set gas limit for non-Mantle chains
    if (chainId !== 5003) {
      txConfig.gas = BigInt(1000000);
    }

    const hash = await enqueueWalletTx(async () =>
      walletClient.writeContract(txConfig)
    );

    console.log(`✅ Score submitted! Transaction hash: ${hash}`);

    // Ensure the tx is actually confirmed before returning success
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      pollingInterval: 2000,
      timeout: 240000,
    });
    if (receipt.status !== "success") {
      console.error("❌ Score tx failed on-chain", receipt);
      return NextResponse.json(
        { error: "Score transaction failed on-chain", txHash: hash },
        { status: 502 }
      );
    }

    // Confirm score on-chain
    try {
      const maxChecks = 15;
      const delay = 2000;
      for (let i = 0; i < maxChecks; i++) {
        const m: any = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: SurgeGamingABI,
          functionName: "getMatch",
          args: [matchId],
        });
        const isP1 =
          m.player1 &&
          String(m.player1).toLowerCase() === String(playerAddress).toLowerCase();
        const isP2 =
          m.player2 &&
          String(m.player2).toLowerCase() === String(playerAddress).toLowerCase();

        const p1 = Number(m.player1Score);
        const p2 = Number(m.player2Score);
        const ok = (isP1 && p1 === normalizedScore) ||
          (isP2 && p2 === normalizedScore);
        if (ok) {
          console.log(
            `✅ On-chain score confirmed for ${playerAddress}. P1:${p1} P2:${p2}`
          );
          break;
        }
        if (i === maxChecks - 1) {
          console.warn(
            `⚠️ Score not yet reflected after ${maxChecks} attempts. Proceeding but declare-winner may need to retry.`
          );
        } else {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    } catch (confirmErr) {
      console.warn("⚠️ Unable to confirm score reflection on-chain", confirmErr);
    }

    return NextResponse.json({
      success: true,
      txHash: hash,
      matchId,
      playerAddress,
      score: normalizedScore,
      chainId,
    });
  } catch (error: any) {
    console.error("❌ Error submitting score:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit score" },
      { status: 500 }
    );
  }
}
