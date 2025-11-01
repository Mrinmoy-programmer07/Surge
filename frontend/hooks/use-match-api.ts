import { useState, useEffect, useCallback } from "react";

interface MatchState {
  matchId: string;
  player1: string;
  player2: string;
  player1Score: number | null;
  player2Score: number | null;
  winner: string | null;
  status: "waiting" | "in_progress" | "finished";
  gameData: any;
}

export function useMatchApi(matchId: string, playerAddress: string) {
  const [matchState, setMatchState] = useState<MatchState>({
    matchId: "",
    player1: "",
    player2: "",
    player1Score: null,
    player2Score: null,
    winner: null,
    status: "waiting",
    gameData: {},
  });
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize match
  const initializeMatch = useCallback(
    async (player1: string, player2: string, gameData?: any) => {
      try {
        const response = await fetch(`/api/matches/${matchId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player1,
            player2,
            status: "in_progress",
            gameData: gameData || {},
          }),
        });

        if (!response.ok) throw new Error("Failed to initialize match");

        const data = await response.json();
        setMatchState(data);
        console.log("✅ Match initialized:", data);
      } catch (err) {
        console.error("Failed to initialize match:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [matchId]
  );

  // Submit score
  const submitScore = useCallback(
    async (score: number) => {
      try {
        console.log("📤 Submitting score:", { matchId, playerAddress, score });

        const response = await fetch(`/api/matches/${matchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerAddress,
            score,
          }),
        });

        if (!response.ok) throw new Error("Failed to submit score");

        const data = await response.json();
        setMatchState(data);
        console.log("✅ Score submitted successfully:", data);

        // Start polling for opponent's score
        setIsPolling(true);
      } catch (err) {
        console.error("Failed to submit score:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [matchId, playerAddress]
  );

  // Submit winner
  const submitWinner = useCallback(
    async (winner: string) => {
      try {
        console.log("📤 Submitting winner:", { matchId, winner });

        const response = await fetch(`/api/matches/${matchId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winner }),
        });

        if (!response.ok) throw new Error("Failed to submit winner");

        const data = await response.json();
        setMatchState(data);
        console.log("✅ Winner submitted successfully:", data);

        // Stop polling
        setIsPolling(false);
      } catch (err) {
        console.error("Failed to submit winner:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [matchId]
  );

  // Poll for match updates
  useEffect(() => {
    if (!matchId || !isPolling) return;

    console.log("🔄 Starting polling for match updates...");

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}`);

        if (!response.ok) {
          console.warn("Failed to fetch match state");
          return;
        }

        const data = await response.json();

        console.log("📊 Poll update:", {
          player1Score: data.player1Score,
          player2Score: data.player2Score,
          status: data.status,
        });

        setMatchState(data);

        // Stop polling when both scores are available
        if (data.player1Score !== null && data.player2Score !== null) {
          console.log("✅ Both scores received, stopping poll");
          setIsPolling(false);
        }

        // Stop polling if match is finished
        if (data.status === "finished") {
          console.log("✅ Match finished, stopping poll");
          setIsPolling(false);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000); // Poll every 1 second

    return () => {
      console.log("🛑 Stopping polling");
      clearInterval(pollInterval);
    };
  }, [matchId, isPolling]);

  // When polling stops or match transitions to finished, do an immediate refresh
  // and a few short retries so clients that stopped polling (loser) get the final
  // match state written by declare-winner on the server.
  useEffect(() => {
    if (!matchId) return;

    const doRefresh = async () => {
      try {
        const resp = await fetch(`/api/matches/${matchId}`);
        if (resp.ok) {
          const data = await resp.json();
          setMatchState(data);
        }
      } catch (e) {
        // ignore
      }
    };

    // Only run this refresh when polling just stopped or when match is finished.
    if (!isPolling || matchState.status === "finished") {
      // immediate
      doRefresh();

      // 3 short retries to handle slight delays in the server's in-memory update
      let attempts = 0;
      const iv = setInterval(() => {
        attempts++;
        doRefresh();
        if (attempts >= 3) clearInterval(iv);
      }, 2000);

      return () => clearInterval(iv);
    }
  }, [matchId, isPolling, matchState.status]);

  return {
    matchState,
    initializeMatch,
    submitScore,
    submitWinner,
    error,
    isPolling,
  };
}
