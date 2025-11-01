import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import SurgeGamingABI from "@/lib/abi/SurgeGaming.json";
import { SURGE_GAMING_ADDRESS } from "@/lib/contracts";
import { enqueueWalletTx } from "@/lib/tx-queue";

// Flow EVM Testnet chain config
const flowTestnet = {
  id: 545,
  name: "Flow EVM Testnet",
  network: "flow-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Flow",
    symbol: "FLOW",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC ||
          "https://testnet.evm.nodes.onflow.org",
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC ||
          "https://testnet.evm.nodes.onflow.org",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Flow EVM Explorer",
      url: "https://evm-testnet.flowscan.io",
    },
  },
  testnet: true,
};

// Backend wallet for oracle operations
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY as `0x${string}`;
const IS_TESTNET = process.env.NEXT_PUBLIC_NETWORK !== "mainnet";

const account = BACKEND_PRIVATE_KEY
  ? privateKeyToAccount(BACKEND_PRIVATE_KEY)
  : null;

const walletClient = account
  ? createWalletClient({
      account,
      chain: IS_TESTNET ? flowTestnet : celo,
      transport: http(),
    })
  : null;

const publicClient = createPublicClient({
  chain: IS_TESTNET ? flowTestnet : celo,
  transport: http(),
});

/**
 * POST /api/contract/declare-winner
 * Backend declares winner after both scores submitted
 */
export async function POST(request: NextRequest) {
  try {
    if (!walletClient || !account) {
      return NextResponse.json(
        { error: "Backend wallet not configured" },
        { status: 500 }
      );
    }

    const {
      matchId,
      winnerAddress,
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

    console.log(`🏆 Declaring winner for match ${matchId}: ${winnerAddress}`);

  // Wait for scores to be confirmed on-chain (with retry)
  // We'll proceed if: both scores > 0 OR exactly one score > 0 and it matches the provided winner
  const maxRetries = 20; // give more time for the second score to land
    const retryDelay = 2000; // 2 seconds
    let matchData: any;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        matchData = await publicClient.readContract({
          address: SURGE_GAMING_ADDRESS as `0x${string}`,
          abi: SurgeGamingABI,
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
        if (matchData.status !== 1) {
          const statusNames = [
            "Pending",
            "Active",
            "Completed",
            "Cancelled",
            "Draw",
          ];
          console.warn(
            `⚠️ Match ${matchId} is not Active. Current status: ${
              statusNames[matchData.status] || matchData.status
            }`
          );
          return NextResponse.json(
            {
              error: `Match is ${
                statusNames[matchData.status] || "invalid status"
              }`,
            },
            { status: 400 }
          );
        }

        // Extract scores
        const player1Score = Number(matchData.player1Score);
        const player2Score = Number(matchData.player2Score);

        // If both submitted, proceed
        if (player1Score > 0 && player2Score > 0) {
          console.log(
            `✅ Both scores confirmed on-chain! Player1: ${player1Score}, Player2: ${player2Score}`
          );
          break;
        }

        // If only one score is present and the provided winner has the higher score (> 0 vs 0), proceed as well
        const onlyOneScorePresent =
          (player1Score > 0 && player2Score === 0) ||
          (player2Score > 0 && player1Score === 0);
        if (onlyOneScorePresent) {
          const onChainWinnerIsP1 =
            winnerAddress &&
            matchData.player1 &&
            winnerAddress.toLowerCase() === String(matchData.player1).toLowerCase();
          const onChainWinnerIsP2 =
            winnerAddress &&
            matchData.player2 &&
            winnerAddress.toLowerCase() === String(matchData.player2).toLowerCase();

          const winnerHasHigherOnChain =
            (onChainWinnerIsP1 && player1Score > player2Score) ||
            (onChainWinnerIsP2 && player2Score > player1Score);

          // Fallback: use provided off-chain players & scores to infer winner
          let winnerHasHigherOffChain = false;
          try {
            if (
              offChainPlayer1 &&
              offChainPlayer2 &&
              typeof offChainP1Score !== "undefined" &&
              typeof offChainP2Score !== "undefined"
            ) {
              const offP1 = Number(offChainP1Score || 0);
              const offP2 = Number(offChainP2Score || 0);
              const offIsP1 =
                winnerAddress.toLowerCase() ===
                String(offChainPlayer1).toLowerCase();
              const offIsP2 =
                winnerAddress.toLowerCase() ===
                String(offChainPlayer2).toLowerCase();
              winnerHasHigherOffChain =
                (offIsP1 && offP1 > offP2) || (offIsP2 && offP2 > offP1);
            }
          } catch (e) {
            // ignore parsing errors
          }

          if (winnerHasHigherOnChain || winnerHasHigherOffChain) {
            console.log(
              `✅ One score present and winner inferred (onChain: ${winnerHasHigherOnChain}, offChain: ${winnerHasHigherOffChain}). Proceeding. P1:${player1Score} P2:${player2Score}`
            );
            break;
          }
        }

        // Otherwise, wait and retry
        if (attempt < maxRetries - 1) {
          console.log(
            `⏳ Waiting for scores to be confirmed... (Player1: ${player1Score}, Player2: ${player2Score})`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          attempt++;
        } else {
          // Last attempt failed
          console.error(
            `❌ Timeout waiting for scores. Player1: ${player1Score}, Player2: ${player2Score}`
          );
          return NextResponse.json(
            {
              error: "Scores not yet confirmed on-chain",
              details: `After ${maxRetries} attempts, scores still not visible on-chain`,
              shouldRetry: true,
            },
            { status: 425 }
          );
        }
      } catch (readError: any) {
        console.error(
          `❌ Error reading match on attempt ${attempt + 1}:`,
          readError.message
        );
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          attempt++;
        } else {
          return NextResponse.json(
            {
              error: "Match not found on-chain",
              details: readError.message,
              shouldRetry: true,
            },
            { status: 425 }
          );
        }
      }
    }

    // Before sending, if only one score is visible, infer the on-chain winner to avoid revert
    let effectiveWinner = winnerAddress as `0x${string}`;
    try {
      const latest: any = await publicClient.readContract({
        address: SURGE_GAMING_ADDRESS as `0x${string}`,
        abi: SurgeGamingABI,
        functionName: "getMatch",
        args: [matchId],
      });
      const p1 = Number(latest.player1Score);
      const p2 = Number(latest.player2Score);
      const chainP1 = String(latest.player1).toLowerCase();
      const chainP2 = String(latest.player2).toLowerCase();
      if (p1 !== 0 || p2 !== 0) {
        if (p1 > p2) effectiveWinner = latest.player1 as `0x${string}`;
        else if (p2 > p1) effectiveWinner = latest.player2 as `0x${string}`;
        else effectiveWinner =
          "0x0000000000000000000000000000000000000000" as `0x${string}`; // draw
        if (effectiveWinner.toLowerCase() !== winnerAddress.toLowerCase()) {
          console.warn(
            `⚠️ Overriding provided winner with on-chain inferred winner: ${effectiveWinner}`
          );
        }
      }
    } catch (e) {
      console.warn("⚠️ Could not re-read match before declareWinner", e);
    }

    // Use bumped legacy gas price for reliability
    const baseGasPrice = await publicClient.getGasPrice();
    const gasPrice = (baseGasPrice * BigInt(12)) / BigInt(10); // +20%
    const gas = await publicClient.estimateContractGas({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "declareWinner",
      args: [matchId, effectiveWinner],
      account: account!,
    });

    // Declare winner in smart contract (serialized)
    const hash = await enqueueWalletTx(async () =>
      walletClient.writeContract({
        address: SURGE_GAMING_ADDRESS as `0x${string}`,
        abi: SurgeGamingABI,
        functionName: "declareWinner",
        args: [matchId, effectiveWinner],
        gas,
        gasPrice,
      })
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

    // Optionally, wait until the on-chain status reflects Completed to avoid withdraw races
    try {
      let checks = 0;
      while (checks < 10) {
        const after: any = await publicClient.readContract({
          address: SURGE_GAMING_ADDRESS as `0x${string}`,
          abi: SurgeGamingABI,
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

    // Update local match store so both clients can read final scores immediately
    try {
      const latestAfter: any = await publicClient.readContract({
        address: SURGE_GAMING_ADDRESS as `0x${string}`,
        abi: SurgeGamingABI,
        functionName: "getMatch",
        args: [matchId],
      });

      // Post the refreshed on-chain match to our local API so in-memory store is up-to-date
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
    } catch (e) {
      console.warn("⚠️ Failed to update local match store after declare-winner:", e);
    }

    return NextResponse.json({
      success: true,
      txHash: hash,
      matchId,
      winner: effectiveWinner,
    });
  } catch (error: any) {
    console.error("❌ Error declaring winner:", error);
    return NextResponse.json(
      { error: error.message || "Failed to declare winner" },
      { status: 500 }
    );
  }
}
