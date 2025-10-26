"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";

interface MatchmakingMessage {
  type: "MATCH_FOUND" | "PONG" | "ERROR";
  payload?: {
    player1: string;
    player2: string;
    gameType: string;
    stake: number;
    matchId: string;
    gameStartTime: number;
  };
}

export function useWebSocketMatchmaking(gameType: string, stake: string) {
  const [opponent, setOpponent] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { address, isConnected: walletConnected } = useAccount();

  const connect = () => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    try {
      console.log("🔌 Attempting to connect to WebSocket server...");
      const ws = new WebSocket("ws://localhost:8080");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ Connected to matchmaking server");
        setIsConnected(true);
        setError(null);

        // Start ping interval to keep connection alive
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "PING" }));
          }
        }, 30000); // Ping every 30 seconds

        // Join queue if wallet is connected
        if (walletConnected && address) {
          joinQueue();
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: MatchmakingMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onclose = (event) => {
        console.log("❌ Disconnected from matchmaking server", {
          code: event.code,
          reason: event.reason,
        });
        setIsConnected(false);

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Only attempt to reconnect if it wasn't a manual close and not already reconnecting
        if (
          event.code !== 1000 &&
          event.code !== 1001 &&
          !reconnectTimeoutRef.current
        ) {
          // Attempt to reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("🔄 Attempting to reconnect...");
            reconnectTimeoutRef.current = null;
            connect();
          }, 3000);
        }
      };

      ws.onerror = (errorEvent) => {
        // Better inspection of websocket error/events so empty objects don't hide useful info
        // Use console.warn instead of console.error to avoid triggering dev overlay for non-fatal events
        try {
          // If it's an Event (common), log its type and any known properties
          if (errorEvent instanceof Event) {
            console.warn("WebSocket error event:", {
              type: errorEvent.type,
              isTrusted: (errorEvent as any).isTrusted,
              target: (errorEvent as any).target?.constructor?.name,
            });

            // some browsers attach a message or reason on the event object (non-standard)
            if ((errorEvent as any).message) {
              console.warn(
                "WebSocket error message:",
                (errorEvent as any).message
              );
            }
          } else {
            // fallback for Error-like objects
            console.warn("WebSocket error object:", errorEvent);
          }

          // Attempt to stringify safely for remote logging (optional debug)
          try {
            const safe = JSON.stringify(
              errorEvent,
              Object.getOwnPropertyNames(errorEvent)
            );
            if (safe && safe !== '{"isTrusted":true}') {
              console.debug("WebSocket error (json):", safe);
            }
          } catch (err) {
            // ignore stringify errors
          }

          // Derive a user-friendly message if possible
          let errorMessage = "Connection failed";
          const evAny = errorEvent as any;
          if (evAny && evAny.type) errorMessage = evAny.type;
          else if (evAny && evAny.message) errorMessage = evAny.message;
          else if (evAny && evAny.code)
            errorMessage = `Error code: ${evAny.code}`;

          setError(`Connection error: ${errorMessage}`);
        } catch (e) {
          console.warn("Failed to log websocket error safely", e);
        }
      };
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      setError("Failed to connect");
    }
  };

  const disconnect = () => {
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
    setIsSearching(false);
    setOpponent(null);
    setMatchId(null);
    setGameStartTime(null);
  };

  const sendMessage = (type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const joinQueue = () => {
    if (!walletConnected || !address) {
      console.error("❌ Wallet not connected");
      return;
    }

    console.log("🎮 Joining matchmaking queue...", { gameType, stake });
    sendMessage("JOIN_QUEUE", {
      playerAddress: address,
      gameType,
      stake: parseFloat(stake),
    });
    setIsSearching(true);
  };

  const leaveQueue = () => {
    if (walletConnected && address) {
      sendMessage("LEAVE_QUEUE", { playerAddress: address });
    }
    setIsSearching(false);
    setOpponent(null);
    setMatchId(null);
    setGameStartTime(null);
  };

  const handleMessage = (message: MatchmakingMessage) => {
    switch (message.type) {
      case "MATCH_FOUND":
        const {
          player1,
          player2,
          matchId: newMatchId,
          gameStartTime: newGameStartTime,
        } = message.payload!;
        if (player1 === address || player2 === address) {
          setOpponent(player1 === address ? player2 : player1);
          setMatchId(newMatchId);
          setGameStartTime(newGameStartTime);
          setIsSearching(false);
          console.log("🎯 Match found!", message.payload);
          console.log(
            `⏰ Game starts at: ${new Date(newGameStartTime).toISOString()}`
          );
        }
        break;

      case "PONG":
        // Handle ping/pong for connection health
        break;

      case "ERROR":
        setError(message.payload?.message || "Unknown error");
        setIsSearching(false);
        break;
    }
  };

  // Connect when wallet is connected
  useEffect(() => {
    if (walletConnected && address) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [walletConnected, address]);

  // Join queue when game type or stake changes
  useEffect(() => {
    if (isConnected && walletConnected && address) {
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
    joinQueue,
    leaveQueue,
    reconnect: connect,
  };
}
