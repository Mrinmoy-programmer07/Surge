"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import { io, Socket } from "socket.io-client";

interface GameState {
  matchId: string | null;
  gameType: string | null;
  stake: string | null;
  player1: string | null;
  player2: string | null;
  currentPlayer: string | null;
  player1Score: number;
  player2Score: number;
  gameData: any;
  status: "waiting_for_ready" | "in_progress" | "paused" | "finished";
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
  const socketRef = useRef<Socket | null>(null);
  const lastSeqRef = useRef<number>(0);

  const { address, isConnected: walletConnected } = useAccount();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log("Game Socket.io already connected");
      return;
    }

    try {
      console.log("🔌 Connecting to game server...");
      const socket = io(process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080", {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Connected to game server");
        setIsConnected(true);
        setError(null);
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from game server:", reason);
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("Game socket connection error:", err.message);
        setError(`Game connection error: ${err.message}`);
      });

      // Game events
      socket.on("game_start", (payload) => {
        console.log("🎮 Game started!", payload);
        const seq = payload?.seq;
        if (typeof seq === "number" && seq <= lastSeqRef.current) return;
        if (typeof seq === "number") lastSeqRef.current = seq;

        setGameState((prev) => ({
          ...prev,
          matchId: payload.matchId,
          gameType: payload.gameType,
          stake: payload.stake,
          player1: payload.player1,
          player2: payload.player2,
          currentPlayer: payload.currentPlayer,
          gameData: payload.gameData || {},
          status: "in_progress",
          player1Score: 0,
          player2Score: 0,
        }));
      });

      socket.on("turn_change", (payload) => {
        console.log("🔄 Turn changed:", payload);
        const seq = payload?.seq;
        if (typeof seq === "number" && seq <= lastSeqRef.current) return;
        if (typeof seq === "number") lastSeqRef.current = seq;

        setGameState((prev) => ({
          ...prev,
          currentPlayer: payload.currentPlayer,
          gameData: payload.gameData || prev.gameData,
        }));
      });

      socket.on("score_update", (payload) => {
        console.log("📊 Score updated:", payload);
        const seq = payload?.seq;
        if (typeof seq === "number" && seq <= lastSeqRef.current) return;
        if (typeof seq === "number") lastSeqRef.current = seq;

        setGameState((prev) => ({
          ...prev,
          player1Score: payload.player1Score,
          player2Score: payload.player2Score,
          gameData: payload.gameData || prev.gameData,
        }));
      });

      socket.on("game_over", (payload) => {
        console.log("🏁 Game over! Winner:", payload.winner);
        setGameState((prev) => ({
          ...prev,
          status: "finished",
          winner: payload.winner,
          player1Score: payload.player1Score,
          player2Score: payload.player2Score,
          gameData: payload.gameData || prev.gameData,
        }));
      });

      socket.on("opponent_disconnected", (payload) => {
        console.log("⚠️ Opponent disconnected:", payload.message);
        setGameState((prev) => ({
          ...prev,
          status: "paused",
        }));
      });

      socket.on("game_resumed", (payload) => {
        console.log("▶️ Game resumed:", payload);
        setGameState((prev) => ({
          ...prev,
          status: "in_progress",
          currentPlayer: payload.currentPlayer,
          gameData: payload.gameData || prev.gameData,
        }));
      });

      socket.on("error", (payload) => {
        console.error("Game error:", payload.message);
        setError(payload.message);
      });

    } catch (err) {
      console.error("Failed to connect to game server:", err);
      setError("Failed to connect to game server");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
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

  // Game actions
  const markReady = useCallback(
    (matchId: string) => {
      if (!address || !socketRef.current?.connected) return;
      socketRef.current.emit("game_ready", { matchId, playerAddress: address });
    },
    [address]
  );

  const submitTurn = useCallback(
    (matchId: string, data?: any) => {
      if (!address || !socketRef.current?.connected) return;
      socketRef.current.emit("game_action", {
        matchId,
        playerAddress: address,
        action: "SUBMIT_TURN",
        data,
      });
    },
    [address]
  );

  const updateScore = useCallback(
    (matchId: string, score: number, gameData?: any) => {
      if (!address || !socketRef.current?.connected) return;
      socketRef.current.emit("game_action", {
        matchId,
        playerAddress: address,
        action: "UPDATE_SCORE",
        data: { score, gameData },
      });
    },
    [address]
  );

  const endGame = useCallback(
    (matchId: string, winner: string, gameData?: any) => {
      if (!address || !socketRef.current?.connected) return;
      socketRef.current.emit("game_action", {
        matchId,
        playerAddress: address,
        action: "GAME_OVER",
        data: { winner, gameData },
      });
    },
    [address]
  );

  // Connect when wallet is connected
  useEffect(() => {
    if (walletConnected && address) {
      const timer = setTimeout(() => {
        connect();
      }, 500);

      return () => clearTimeout(timer);
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
