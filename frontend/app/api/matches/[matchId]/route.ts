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
    // helper: submit score to on-chain submit-score endpoint with retries
    const submitScoreToContract = async (payload: {
      matchId: string;
      playerAddress: string;
      score: number;
    }) => {
      const maxAttempts = 5;
      const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const res = await fetch(`${request.nextUrl.origin}/api/contract/submit-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (res.ok) {
            const j = await res.json();
            if (j && j.success) return { success: true, json: j };
            // If server returned not-ok but ok status, treat as success only when flagged
            return { success: Boolean(j && j.success), json: j };
          }

          // If server indicates resource not ready, retry
          if (res.status === 425) {
            const j = await res.json().catch(() => ({}));
            console.warn(
              `⚠️ submit-score attempt ${attempt + 1} returned 425, will retry`,
              j
            );
            await delay(2000);
            continue;
          }

          // Non-retriable failure
          const body = await res.text();
          return { success: false, error: `Status ${res.status}: ${body}` };
        } catch (e: any) {
          console.error(`❌ submit-score network error on attempt ${attempt + 1}:`, e.message || e);
          await delay(1500);
        }
      }
      return { success: false, error: "Max attempts reached" };
    };

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
      
      // Submit score to smart contract (with retries). If it fails, we do NOT set
      // the match to finished nor declare a winner until it succeeds.
      try {
        const r = await submitScoreToContract({ matchId, playerAddress, score });
        if (r.success) console.log(`✅ Score submitted to smart contract for player1`);
        else console.warn(`⚠️ submit-score for player1 failed:`, r.error || r.json || "unknown");
      } catch (error) {
        console.error("❌ Failed to submit score to smart contract:", error);
      }
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
      
      // Submit score to smart contract (with retries). We will only proceed to
      // declare a winner if this submission succeeded (and the other one did too).
      let submit2Ok = false;
      try {
        const r = await submitScoreToContract({ matchId, playerAddress, score });
        submit2Ok = Boolean(r.success);
        if (submit2Ok) console.log(`✅ Score submitted to smart contract for player2`);
        else console.warn(`⚠️ submit-score for player2 failed:`, r.error || r.json || "unknown");
      } catch (error) {
        console.error("❌ Failed to submit score to smart contract:", error);
      }

      // Both scores submitted off-chain; only declare winner if both on-chain submissions
      // were at least attempted successfully. If the first submission didn't reach
      // chain, we should not call declare-winner because it will timeout.
      if (match.player1Score !== null && match.player2Score !== null && submit2Ok) {
        match.status = "finished";

        console.log("✅ Both scores received, marking as finished", {
          matchId,
          player1Score: match.player1Score,
          player2Score: match.player2Score,
          status: match.status,
        });

        // Check for tie
        if (match.player1Score === match.player2Score) {
          console.log("🤝 Match ended in a tie!", {
            matchId,
            score: match.player1Score,
          });

          match.winner = null; // No winner for ties

          // Declare tie on smart contract (pass address(0) as winner)
          try {
            await fetch(
              `${request.nextUrl.origin}/api/contract/declare-winner`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  matchId,
                  winnerAddress: "0x0000000000000000000000000000000000000000", // Zero address for tie
                  // include off-chain players & scores to help backend decide when on-chain
                  offChainPlayer1: match.player1,
                  offChainPlayer2: match.player2,
                  offChainP1Score: match.player1Score,
                  offChainP2Score: match.player2Score,
                }),
              }
            );
            console.log(`🤝 Tie declared on smart contract`);
          } catch (error) {
            console.error("❌ Failed to declare tie on smart contract:", error);
          }
        } else {
          // Normal win - determine winner
          const winnerAddress =
            match.player1Score > match.player2Score
              ? match.player1
              : match.player2;

          match.winner = winnerAddress;

          // Declare winner on smart contract
          try {
            await fetch(
              `${request.nextUrl.origin}/api/contract/declare-winner`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  matchId,
                  winnerAddress,
                  // pass off-chain players & scores so the backend can make
                  // an informed decision even if one submit hasn't reflected on-chain
                  offChainPlayer1: match.player1,
                  offChainPlayer2: match.player2,
                  offChainP1Score: match.player1Score,
                  offChainP2Score: match.player2Score,
                }),
              }
            );
            console.log(
              `🏆 Winner declared on smart contract: ${winnerAddress}`
            );
          } catch (error) {
            console.error(
              "❌ Failed to declare winner on smart contract:",
              error
            );
          }
        }
      }
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

  // Update winner (manual override if needed)
  if (winner && !match.winner) {
    match.winner = winner;
    match.status = "finished";
    console.log(`🏆 Winner set: ${winner}`, {
      matchId,
      status: match.status,
      player1Score: match.player1Score,
      player2Score: match.player2Score,
    });

    // Only declare if not a tie
    if (winner !== "0x0000000000000000000000000000000000000000") {
      // Declare winner on smart contract
      try {
        await fetch(`${request.nextUrl.origin}/api/contract/declare-winner`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            winnerAddress: winner,
          }),
        });
        console.log(`🏆 Winner declared on smart contract: ${winner}`);
      } catch (error) {
        console.error("❌ Failed to declare winner on smart contract:", error);
      }
    }
  }

  // Check if both players have submitted scores
  if (
    match.player1Score !== null &&
    match.player2Score !== null &&
    match.status !== "finished"
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
