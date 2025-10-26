import { NextRequest, NextResponse } from "next/server";

// In-memory storage for withdrawals (replace with database in production)
const withdrawals = new Map<
  string,
  {
    matchId: string;
    playerAddress: string;
    amount: string;
    timestamp: number;
    status: "pending" | "completed" | "failed";
  }
>();

export async function POST(request: NextRequest) {
  const { matchId, playerAddress, amount, stake, platformFee } =
    await request.json();

  console.log("💰 Withdrawal request:", {
    matchId,
    playerAddress,
    stake,
    totalPot: parseFloat(stake) * 2,
    platformFee,
    playerPayout: amount,
  });

  // Check if player already withdrew from this match
  const withdrawalKey = `${matchId}-${playerAddress}`;
  if (withdrawals.has(withdrawalKey)) {
    return NextResponse.json(
      { error: "Already withdrawn from this match" },
      { status: 400 }
    );
  }

  // Note: Actual withdrawal happens on the frontend by calling smart contract's withdraw() function
  // This API endpoint just tracks the withdrawal status off-chain
  // The smart contract prevents double withdrawals on-chain

  // Record the withdrawal
  withdrawals.set(withdrawalKey, {
    matchId,
    playerAddress,
    amount,
    timestamp: Date.now(),
    status: "completed",
  });

  console.log(
    "✅ Withdrawal recorded (on-chain withdrawal must be done by frontend):",
    {
      matchId,
      playerAddress,
      playerPayout: amount,
      platformRevenue: platformFee,
    }
  );

  return NextResponse.json({
    success: true,
    message:
      "Withdrawal recorded. Please complete on-chain withdrawal via smart contract.",
    amount,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");
  const playerAddress = searchParams.get("playerAddress");

  if (!matchId || !playerAddress) {
    return NextResponse.json(
      { error: "matchId and playerAddress required" },
      { status: 400 }
    );
  }

  const withdrawalKey = `${matchId}-${playerAddress}`;
  const withdrawal = withdrawals.get(withdrawalKey);

  if (!withdrawal) {
    return NextResponse.json({ withdrawn: false });
  }

  return NextResponse.json({
    withdrawn: true,
    ...withdrawal,
  });
}
