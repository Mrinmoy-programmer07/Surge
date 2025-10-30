import { NextRequest, NextResponse } from "next/server";

// In-memory matchmaking queue
const matchmakingQueue = new Map<
  string,
  {
    playerAddress: string;
    gameType: string;
    stake: string;
    timestamp: number;
  }
>();

// Active matches waiting for second player
const pendingMatches = new Map<
  string,
  {
    matchId: string;
    player1: string;
    gameType: string;
    stake: string;
    timestamp: number;
  }
>();

export async function POST(request: NextRequest) {
  const {
    playerAddress,
    gameType,
    stake,
    matchId: providedMatchId,
  } = await request.json();

  console.log("🔍 Matchmaking request:", {
    playerAddress,
    gameType,
    stake,
    matchId: providedMatchId,
  });

  // Look for an existing player waiting for a match with same game type and stake
  for (const [waitingPlayer, data] of pendingMatches.entries()) {
    if (
      data.gameType === gameType &&
      data.stake === stake &&
      data.player1 !== playerAddress
    ) {
      // Found a match!
      const matchId = data.matchId;

      console.log("✅ Match found!", {
        matchId,
        player1: data.player1,
        player2: playerAddress,
      });

      // Remove from pending matches
      pendingMatches.delete(waitingPlayer);

      return NextResponse.json({
        matched: true,
        matchId,
        opponent: data.player1,
        isPlayer1: false, // This player is player2
      });
    }
  }

  // No match found, create a new pending match
  // Use the matchId provided by frontend (which will be used for smart contract)
  const matchId =
    providedMatchId ||
    `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  pendingMatches.set(playerAddress, {
    matchId,
    player1: playerAddress,
    gameType,
    stake,
    timestamp: Date.now(),
  });

  console.log("⏳ No match found, waiting...", {
    matchId,
    player1: playerAddress,
    pendingMatchesCount: pendingMatches.size,
  });

  return NextResponse.json({
    matched: false,
    matchId,
    message: "Waiting for opponent...",
  });
}

// Poll endpoint to check if match was found
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerAddress = searchParams.get("playerAddress");

  if (!playerAddress) {
    return NextResponse.json(
      { error: "playerAddress required" },
      { status: 400 }
    );
  }

  // Check if this player is still waiting
  const pendingMatch = pendingMatches.get(playerAddress);

  if (!pendingMatch) {
    // Player is no longer in queue (match was found)
    return NextResponse.json({ matched: true });
  }

  return NextResponse.json({
    matched: false,
    matchId: pendingMatch.matchId,
  });
}

// Cleanup old pending matches (older than 5 minutes)
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [player, data] of pendingMatches.entries()) {
    if (data.timestamp < fiveMinutesAgo) {
      console.log("🧹 Cleaning up old pending match:", player);
      pendingMatches.delete(player);
    }
  }
}, 60 * 1000); // Run every minute
