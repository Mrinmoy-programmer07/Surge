import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
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
 * POST /api/contract/submit-score
 * Backend submits player score to smart contract
 */
export async function POST(request: NextRequest) {
  try {
    if (!walletClient || !account) {
      return NextResponse.json(
        { error: "Backend wallet not configured" },
        { status: 500 }
      );
    }

  const { matchId, playerAddress, score } = await request.json();

    if (!matchId || !playerAddress || score === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, playerAddress, score" },
        { status: 400 }
      );
    }

    console.log(
      `📝 Submitting score for match ${matchId}: Player ${playerAddress} scored ${score}`
    );

    // First, check if match exists and is in Active status on-chain
    let matchData: any;
    try {
      matchData = await publicClient.readContract({
        address: SURGE_GAMING_ADDRESS as `0x${string}`,
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
        { status: 425 } // 425 Too Early - resource not yet available
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
        `⚠️ Match ${matchId} is not Active. Current status: ${
          statusNames[matchData.status] || matchData.status
        }`
      );

      if (matchData.status === 0) {
        // Pending - waiting for second player
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
          error: `Match is ${
            statusNames[matchData.status] || "invalid status"
          }`,
        },
        { status: 400 }
      );
    }

    // Submit score to smart contract (serialized + wait for receipt)
    // Contract treats 0 as "not submitted", so coerce a zero score to 1 on-chain
    // (we still keep the original 0 off-chain for UI display)
    const normalizedScore = Math.max(1, Number(score)) & 0xff; // clamp to uint8

    // Use a slightly bumped legacy gas price for Flow EVM testnet to avoid underpriced/dropped txs
  const baseGasPrice = await publicClient.getGasPrice();
  const gasPrice = (baseGasPrice * BigInt(12)) / BigInt(10); // +20%
    const gas = await publicClient.estimateContractGas({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "submitScore",
      args: [matchId, playerAddress, normalizedScore],
      account: account!,
    });

    const hash = await enqueueWalletTx(async () =>
      walletClient.writeContract({
        address: SURGE_GAMING_ADDRESS as `0x${string}`,
        abi: SurgeGamingABI,
        functionName: "submitScore",
        args: [matchId, playerAddress, normalizedScore],
        gas,
        gasPrice,
      })
    );

    console.log(`✅ Score submitted! Transaction hash: ${hash}`);

    // Ensure the tx is actually confirmed before returning success
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      pollingInterval: 2000,
      timeout: 240000, // 4 minutes
    });
    if (receipt.status !== "success") {
      console.error("❌ Score tx failed on-chain", receipt);
      return NextResponse.json(
        { error: "Score transaction failed on-chain", txHash: hash },
        { status: 502 }
      );
    }

    // Strong confirm: poll getMatch until the submitted score is reflected on-chain
    try {
      const maxChecks = 15; // ~30s
      const delay = 2000;
      for (let i = 0; i < maxChecks; i++) {
        const m: any = await publicClient.readContract({
          address: SURGE_GAMING_ADDRESS as `0x${string}`,
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
    });
  } catch (error: any) {
    console.error("❌ Error submitting score:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit score" },
      { status: 500 }
    );
  }
}
