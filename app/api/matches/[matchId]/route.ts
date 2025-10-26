import { NextRequest, NextResponse } from "next/server";

// In-memory storage for matches (replace with database in production)
const matches = new Map<
  string,
  {
    matchId: string;
    player1: string;
    player2: string;
    player1Score: number | null;
    player2Score: number | null;
    winner: string | null;
    status: "waiting" | "in_progress" | "finished";
    gameData: any;
    createdAt: number;
  }
>();

// Cleanup old matches (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [matchId, match] of matches.entries()) {
    if (match.createdAt < oneHourAgo) {
      matches.delete(matchId);
    }
  }
}, 5 * 60 * 1000); // Run every 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const match = matches.get(matchId);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const body = await request.json();

  let match = matches.get(matchId);

  if (!match) {
    // Create new match
    match = {
      matchId,
      player1: body.player1 || "",
      player2: body.player2 || "",
      player1Score: null,
      player2Score: null,
      winner: null,
      status: "waiting",
      gameData: body.gameData || {},
      createdAt: Date.now(),
    };
  }

  // Update match data
  if (body.player1) match.player1 = body.player1;
  if (body.player2) match.player2 = body.player2;
  if (body.status) match.status = body.status;
  if (body.gameData) match.gameData = { ...match.gameData, ...body.gameData };

  matches.set(matchId, match);

  return NextResponse.json(match);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const body = await request.json();
  const { playerAddress, score, winner } = body;

  const match = matches.get(matchId);

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Update player score
  if (playerAddress && typeof score === "number") {
    if (match.player1Score === null) {
      // First player to submit - becomes player1
      match.player1 = playerAddress;
      match.player1Score = score;
      console.log(`📊 First player submitted (player1): ${score}`, {
        matchId,
        playerAddress,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
      });
    } else if (match.player2Score === null && match.player1 !== playerAddress) {
      // Second player to submit - becomes player2
      match.player2 = playerAddress;
      match.player2Score = score;
      console.log(`📊 Second player submitted (player2): ${score}`, {
        matchId,
        playerAddress,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
      });
    } else {
      console.log(
        `⚠️ Score submission ignored (both players already submitted)`,
        {
          matchId,
          playerAddress,
        }
      );
    }
  }

  // Update winner
  if (winner) {
    match.winner = winner;
    match.status = "finished";
    console.log(`🏆 Winner set: ${winner}`, {
      matchId,
      status: match.status,
      player1Score: match.player1Score,
      player2Score: match.player2Score,
    });
  }

  // Check if both players have submitted scores
  if (
    match.player1Score !== null &&
    match.player2Score !== null &&
    !match.winner
  ) {
    match.status = "finished";
    console.log(`✅ Both scores received, marking as finished`, {
      matchId,
      player1Score: match.player1Score,
      player2Score: match.player2Score,
      status: match.status,
    });
  }

  matches.set(matchId, match);

  return NextResponse.json(match);
}
