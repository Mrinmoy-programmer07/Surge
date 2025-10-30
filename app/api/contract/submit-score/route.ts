import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import SurgeGamingABI from "@/lib/abi/SurgeGaming.json";
import { SURGE_GAMING_ADDRESS } from "@/lib/contracts";

// Celo Sepolia testnet chain config
const celoSepolia = {
  id: 44787,
  name: "Celo Sepolia Testnet",
  network: "celo-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "CELO",
    symbol: "CELO",
  },
  rpcUrls: {
    default: {
      http: ["http://forno.celo-sepolia.celo-testnet.org"],
    },
    public: {
      http: ["http://forno.celo-sepolia.celo-testnet.org"],
    },
  },
  blockExplorers: {
    default: { name: "Celoscan", url: "https://sepolia.celoscan.io" },
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
      chain: IS_TESTNET ? celoSepolia : celo,
      transport: http(),
    })
  : null;

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

    // Submit score to smart contract
    const hash = await walletClient.writeContract({
      address: SURGE_GAMING_ADDRESS as `0x${string}`,
      abi: SurgeGamingABI,
      functionName: "submitScore",
      args: [matchId, playerAddress, score],
    });

    console.log(`✅ Score submitted! Transaction hash: ${hash}`);

    return NextResponse.json({
      success: true,
      txHash: hash,
      matchId,
      playerAddress,
      score,
    });
  } catch (error: any) {
    console.error("❌ Error submitting score:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit score" },
      { status: 500 }
    );
  }
}
