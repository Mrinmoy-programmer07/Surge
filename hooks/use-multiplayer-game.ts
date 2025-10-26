"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";

interface GameMessage {
  type:
    | "GAME_START"
    | "TURN_CHANGE"
    | "SCORE_UPDATE"
    | "GAME_OVER"
    | "ERROR"
    | "PONG";
  payload?: any;
}

interface GameState {
  matchId: string | null;
  gameType: string | null;
  stake: number | null;
  player1: string | null;
  player2: string | null;
  currentPlayer: string | null;
  player1Score: number;
  player2Score: number;
  gameData: any;
  status: "waiting_for_ready" | "in_progress" | "finished";
  winner: string | null;
}

export function useMultiplayerGame() {
  const [gameState, setGameState] = useState<GameState>({
    matchId: null,
    gameType: null,
    stake: null,
    player1: null,
    player2: null,
    currentPlayer: null,
    player1Score: 0,
    player2Score: 0,
    gameData: {},
    status: "waiting_for_ready",
    winner: null,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeqRef = useRef<number>(0);

  const { address, isConnected: walletConnected } = useAccount();

  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log("Game WebSocket already connected or connecting");
      return;
    }

    try {
      console.log("🔌 Connecting to WebSocket server for game...");
      const ws = new WebSocket("ws://localhost:8080");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected to game server");
        setIsConnected(true);
        setError(null);

        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message: GameMessage = JSON.parse(event.data);
          handleGameMessage(message);
        } catch (error) {
          console.error("Error parsing game message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("❌ Disconnected from game server", {
          code: event.code,
          reason: event.reason,
        });
        setIsConnected(false);

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Only attempt to reconnect if it wasn't a manual close and not already reconnecting
        if (
          event.code !== 1000 &&
          event.code !== 1001 &&
          !reconnectTimeoutRef.current
        ) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("🔄 Attempting to reconnect to game server...");
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };

      ws.onerror = (errorEvent) => {
        // Better inspection of websocket error/events so empty objects don't hide useful info
        try {
          if (errorEvent instanceof Event) {
            console.warn("Game WebSocket error event type:", errorEvent.type);
            if ((errorEvent as any).message)
              console.warn(
                "Game WebSocket message:",
                (errorEvent as any).message
              );
            console.warn(
              "Game WebSocket error props:",
              Object.getOwnPropertyNames(errorEvent)
            );
          } else {
            console.warn("Game WebSocket error object:", errorEvent);
          }

          let safe = null;
          try {
            safe = JSON.stringify(
              errorEvent,
              Object.getOwnPropertyNames(errorEvent)
            );
          } catch (_) {}
          if (safe) console.warn("Game WebSocket error (json):", safe);

          let errorMessage = "Game connection failed";
          const evAny = errorEvent as any;
          if (evAny && evAny.type) errorMessage = evAny.type;
          else if (evAny && evAny.message) errorMessage = evAny.message;
          else if (evAny && evAny.code)
            errorMessage = `Error code: ${evAny.code}`;

          setError(`Game connection error: ${errorMessage}`);
        } catch (e) {
          console.warn("Failed to log game websocket error safely", e);
        }
      };
    } catch (error) {
      console.error("Failed to connect to game WebSocket:", error);
      setError("Failed to connect to game server");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setGameState({
      matchId: null,
      gameType: null,
      stake: null,
      player1: null,
      player2: null,
      currentPlayer: null,
      player1Score: 0,
      player2Score: 0,
      gameData: {},
      status: "waiting_for_ready",
      winner: null,
    });
  }, []);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const handleGameMessage = useCallback((message: GameMessage) => {
    console.log("🎮 Received game message:", message);
    const seq = message.payload?.seq;
    if (typeof seq === "number") {
      // Ignore older/out-of-order messages
      if (seq <= lastSeqRef.current) {
        console.log(
          `⏱️ Ignoring out-of-order message (seq ${seq} <= last ${lastSeqRef.current})`
        );
        return;
      }
      lastSeqRef.current = seq;
    }

    switch (message.type) {
      case "GAME_START":
        const {
          matchId,
          gameType,
          stake,
          player1,
          player2,
          currentPlayer,
          gameData,
        } = message.payload;
        setGameState((prev) => ({
          ...prev,
          matchId,
          gameType,
          stake,
          player1,
          player2,
          currentPlayer,
          gameData: gameData || {},
          status: "in_progress",
          player1Score: 0,
          player2Score: 0,
        }));
        console.log("🎮 Game started!", message.payload);
        break;

      case "TURN_CHANGE":
        setGameState((prev) => ({
          ...prev,
          currentPlayer: message.payload.currentPlayer,
          gameData: message.payload.gameData || prev.gameData,
        }));
        console.log("🔄 Turn changed to:", message.payload.currentPlayer);
        break;

      case "SCORE_UPDATE":
        setGameState((prev) => ({
          ...prev,
          player1Score: message.payload.player1Score,
          player2Score: message.payload.player2Score,
          gameData: message.payload.gameData || prev.gameData,
        }));
        console.log("📊 Score updated:", message.payload);
        break;

      case "GAME_OVER":
        setGameState((prev) => ({
          ...prev,
          status: "finished",
          winner: message.payload.winner,
          player1Score: message.payload.player1Score,
          player2Score: message.payload.player2Score,
          gameData: message.payload.gameData || prev.gameData,
        }));
        console.log("🏁 Game over! Winner:", message.payload.winner);
        break;

      case "ERROR":
        setError(message.payload?.message || "Unknown error");
        break;

      case "PONG":
        // Handle ping/pong
        break;
    }
  }, []);

  // Game actions
  const markReady = useCallback(
    (matchId: string) => {
      if (!address) return;
      sendMessage("GAME_READY", { matchId, playerAddress: address });
    },
    [address, sendMessage]
  );

  const submitTurn = useCallback(
    (matchId: string, data?: any) => {
      if (!address) return;
      sendMessage("GAME_ACTION", {
        matchId,
        playerAddress: address,
        action: "SUBMIT_TURN",
        data,
      });
    },
    [address, sendMessage]
  );

  const updateScore = useCallback(
    (matchId: string, score: number, gameData?: any) => {
      if (!address) return;
      sendMessage("GAME_ACTION", {
        matchId,
        playerAddress: address,
        action: "UPDATE_SCORE",
        data: { score, gameData },
      });
    },
    [address, sendMessage]
  );

  const endGame = useCallback(
    (matchId: string, winner: string, gameData?: any) => {
      if (!address) return;
      sendMessage("GAME_ACTION", {
        matchId,
        playerAddress: address,
        action: "GAME_OVER",
        data: { winner, gameData },
      });
    },
    [address, sendMessage]
  );

  // Connect when wallet is connected
  useEffect(() => {
    if (walletConnected && address) {
      // Add a small delay to ensure matchmaking WebSocket is connected first
      const timer = setTimeout(() => {
        connect();
      }, 1000);

      return () => {
        clearTimeout(timer);
        disconnect();
      };
    } else {
      disconnect();
    }
  }, [walletConnected, address, connect, disconnect]);

  return {
    gameState,
    isConnected,
    error,
    address,
    markReady,
    submitTurn,
    updateScore,
    endGame,
    reconnect: connect,
  };
}
