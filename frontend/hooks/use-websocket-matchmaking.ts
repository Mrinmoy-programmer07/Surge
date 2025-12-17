"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { io, Socket } from "socket.io-client";

type MatchFoundPayload = {
  player1: string;
  player2: string;
  gameType: string;
  stake: string;
  matchId: string;
  gameStartTime: number;
};

export function useWebSocketMatchmaking(gameType: string, stake: string) {
  const [opponent, setOpponent] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMatchCreator, setIsMatchCreator] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const hasJoinedQueueRef = useRef(false);

  const { address, isConnected: walletConnected } = useAccount();

  const connect = () => {
    if (socketRef.current?.connected) {
      console.log("Socket.io already connected");
      return;
    }

    try {
      console.log("🔌 Connecting to Socket.io server...");
      const socket = io("http://localhost:8080", {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("✅ Connected to matchmaking server");
        setIsConnected(true);
        setError(null);

        // Join queue if wallet connected and not already in queue
        if (walletConnected && address && !hasJoinedQueueRef.current) {
          joinQueue();
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from matchmaking server:", reason);
        setIsConnected(false);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket.io connection error:", err.message);
        setError(`Connection error: ${err.message}`);
      });

      // Matchmaking events
      socket.on("queue_joined", (data) => {
        console.log("📋 Joined queue:", data);
        setIsSearching(true);
      });

      socket.on("queue_rejoined", (data) => {
        console.log("🔄 Rejoined queue:", data);
        setIsSearching(true);
      });

      socket.on("match_found", (data: MatchFoundPayload) => {
        console.log("🎯 Match found!", data);
        if (data.player1 === address || data.player2 === address) {
          setOpponent(data.player1 === address ? data.player2 : data.player1);
          setMatchId(data.matchId);
          setGameStartTime(data.gameStartTime);
          setIsSearching(false);
          setIsMatchCreator(data.player1 === address);
        }
      });

      socket.on("error", (data: { message: string }) => {
        console.error("Server error:", data.message);
        setError(data.message);
        setIsSearching(false);
      });

      socket.on("refund_requested", (data) => {
        console.log("💰 Refund requested:", data);
        // Frontend can show notification here
      });

    } catch (err) {
      console.error("Failed to connect:", err);
      setError("Failed to connect");
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsSearching(false);
    setOpponent(null);
    setMatchId(null);
    setGameStartTime(null);
    setIsMatchCreator(false);
    hasJoinedQueueRef.current = false;
  };

  const joinQueue = (txSignature?: string) => {
    if (!walletConnected || !address) {
      console.error("❌ Wallet not connected");
      return;
    }

    if (hasJoinedQueueRef.current) {
      console.log("⚠️ Already in queue");
      return;
    }

    // TODO: txSignature should come from Solana deposit
    const signature = txSignature || "placeholder_tx_" + Date.now();

    console.log("🎮 Joining queue...", { gameType, stake, txSignature: signature });

    socketRef.current?.emit("join_queue", {
      playerAddress: address,
      gameType,
      stake,
      txSignature: signature,
    });

    hasJoinedQueueRef.current = true;
  };

  const leaveQueue = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_queue");
    }
    setIsSearching(false);
    setOpponent(null);
    setMatchId(null);
    setGameStartTime(null);
    setIsMatchCreator(false);
    hasJoinedQueueRef.current = false;
  };

  // Connect when wallet is connected
  useEffect(() => {
    if (walletConnected && address) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      // Don't disconnect on unmount to preserve connection
    };
  }, [walletConnected, address]);

  // Join queue when connected and game/stake changes
  useEffect(() => {
    if (isConnected && walletConnected && address && !hasJoinedQueueRef.current) {
      joinQueue();
    }
  }, [gameType, stake, isConnected]);

  return {
    opponent,
    matchId,
    gameStartTime,
    isSearching,
    isConnected,
    error,
    address,
    isMatchCreator,
    joinQueue,
    leaveQueue,
    reconnect: connect,
  };
}
