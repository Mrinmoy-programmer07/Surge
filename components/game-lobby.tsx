"use client"

import { useState, useCallback } from "react"
import type { GameType } from "@/lib/game-types"
import GameSelector from "@/components/game-selector"
import StakeSelector from "@/components/stake-selector"
import WaitingRoom from "@/components/waiting-room"
import NumberMemoryGame from "@/components/games/number-memory-game-multiplayer"
import WordScrambleGame from "@/components/games/word-scramble-game"
import PatternPredictorGame from "@/components/games/pattern-predictor-game"
import ReflexWarGame from "@/components/games/reflex-war-game"
import MemoryMatchGame from "@/components/games/memory-match-game"

interface GameLobbyProps {
  account: string
  onDisconnect?: () => void
}

export default function GameLobby({ account, onDisconnect }: GameLobbyProps) {
  const [gameState, setGameState] = useState<"lobby" | "selecting" | "waiting" | "playing">("lobby")
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [stake, setStake] = useState<string>("1")
  const [matchId, setMatchId] = useState<string | null>(null)
  const [opponent, setOpponent] = useState<string | null>(null)

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game)
    setGameState("selecting")
  }

  const handleStakeConfirm = (stakeAmount: string) => {
    setStake(stakeAmount)
    // Generate match ID and move to waiting room
    const id = Math.random().toString(36).substring(7)
    setMatchId(id)
    setGameState("waiting")
  }

  const handleGameStart = useCallback((opponentAddress: string) => {
    setOpponent(opponentAddress)
    setGameState("playing")
  }, [])

  const handleBackToLobby = () => {
    setGameState("lobby")
    setSelectedGame(null)
    setStake("1")
    setMatchId(null)
    setOpponent(null)
  }

  if (gameState === "playing" && selectedGame && matchId && opponent) {
    const gameProps = { account, opponent, stake, matchId }

    switch (selectedGame) {
      case "number-memory":
        return <NumberMemoryGame {...gameProps} />
      case "word-scramble":
        return <WordScrambleGame {...gameProps} />
      case "pattern":
        return <PatternPredictorGame {...gameProps} />
      case "reflex":
        return <ReflexWarGame {...gameProps} />
      case "memory-match":
        return <MemoryMatchGame {...gameProps} />
      default:
        return <NumberMemoryGame {...gameProps} />
    }
  }

  if (gameState === "waiting" && selectedGame && matchId) {
    return (
      <WaitingRoom
        gameType={selectedGame}
        stake={stake}
        matchId={matchId}
        account={account}
        onGameStart={handleGameStart}
      />
    )
  }

  if (gameState === "selecting" && selectedGame) {
    return <StakeSelector game={selectedGame} onConfirm={handleStakeConfirm} onBack={() => setGameState("lobby")} />
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-foreground">Choose Your Challenge</h2>
        <p className="text-lg text-muted-foreground">Compete 1v1 in skill-based games and win cUSD</p>
      </div>

      {/* Game Selection */}
      <GameSelector onSelectGame={handleGameSelect} />
    </div>
  )
}
