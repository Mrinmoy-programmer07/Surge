"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { GameState, GameType } from "./game-types"

interface GameStateContextType {
  gameState: GameState | null
  setGameState: (state: GameState) => void
  updateGameState: (updates: Partial<GameState>) => void
  createGame: (gameType: GameType, player1Address: string, stake: bigint) => GameState
  joinGame: (gameId: string, player2Address: string) => void
  updatePlayerScore: (playerId: "player1" | "player2", score: number) => void
  finishGame: (winner: string) => void
  resetGame: () => void
  isConnected: boolean
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined)

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameStateInternal] = useState<GameState | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    // In production, connect to WebSocket server for real-time game state
    // const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001')
    // ws.onopen = () => setIsConnected(true)
    // ws.onclose = () => setIsConnected(false)
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data)
    //   setGameStateInternal(update)
    // }
    // return () => ws.close()
  }, [])

  const setGameState = useCallback((state: GameState) => {
    setGameStateInternal(state)
    // Broadcast to WebSocket in production
  }, [])

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameStateInternal((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
  }, [])

  const createGame = useCallback(
    (gameType: GameType, player1Address: string, stake: bigint): GameState => {
      const newGame: GameState = {
        id: Math.random().toString(36).substring(7),
        gameType,
        player1: {
          address: player1Address,
          name: "Player 1",
          score: 0,
          isReady: true,
        },
        player2: {
          address: "",
          name: "Waiting...",
          score: 0,
          isReady: false,
        },
        stake,
        status: "waiting",
        player1Score: 0,
        player2Score: 0,
        startTime: Date.now(),
      }
      setGameState(newGame)
      return newGame
    },
    [setGameState],
  )

  const joinGame = useCallback(
    (gameId: string, player2Address: string) => {
      updateGameState({
        player2: {
          address: player2Address,
          name: "Player 2",
          score: 0,
          isReady: true,
        },
        status: "starting",
      })
    },
    [updateGameState],
  )

  const updatePlayerScore = useCallback(
    (playerId: "player1" | "player2", score: number) => {
      if (playerId === "player1") {
        updateGameState({ player1Score: score })
      } else {
        updateGameState({ player2Score: score })
      }
    },
    [updateGameState],
  )

  const finishGame = useCallback(
    (winner: string) => {
      updateGameState({
        status: "finished",
        winner,
        endTime: Date.now(),
      })
    },
    [updateGameState],
  )

  const resetGame = useCallback(() => {
    setGameStateInternal(null)
  }, [])

  const value: GameStateContextType = {
    gameState,
    setGameState,
    updateGameState,
    createGame,
    joinGame,
    updatePlayerScore,
    finishGame,
    resetGame,
    isConnected,
  }

  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>
}

export function useGameState() {
  const context = useContext(GameStateContext)
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider")
  }
  return context
}
