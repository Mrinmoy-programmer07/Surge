"use client"

import { useState, useCallback, useEffect } from "react"
import type { GameType } from "@/lib/game-types"
import GameSelector from "@/components/game-selector"
import StakeSelector from "@/components/stake-selector"
import WaitingRoom from "@/components/waiting-room"
import NumberMemoryGame from "@/components/games/number-memory-game-multiplayer"
import WordScrambleGame from "@/components/games/word-scramble-game"
import PatternPredictorGame from "@/components/games/pattern-predictor-game"
import ReflexWarGame from "@/components/games/reflex-war-game"
import MemoryMatchGame from "@/components/games/memory-match-game"
import { useToast } from "@/hooks/use-toast"
import { useSurgeContract } from "@/hooks/use-surge-contract"
import { parseEther } from "viem"

interface GameLobbyProps {
  account: string
  onDisconnect?: () => void
}

export default function GameLobby({ account, onDisconnect }: GameLobbyProps) {
  const [gameState, setGameState] = useState<"lobby" | "selecting" | "paying" | "waiting" | "playing">("lobby")
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [stake, setStake] = useState<string>("0.0001")
  const [matchId, setMatchId] = useState<string | null>(null)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const { toast } = useToast()
  const { depositStake, isCreatingMatch, matchCreated, createMatchError } = useSurgeContract()

  const handleStakeConfirm = async (stakeAmount: string) => {
    setStake(stakeAmount)
    setGameState("paying")

    try {
      // Generate a temporary matchId for the deposit
      const tempMatchId = `match_${Date.now()}_${Math.random().toString(36).substring(7)}`
      setMatchId(tempMatchId)

      toast({
        title: "Depositing Stake",
        description: `Depositing ${stakeAmount} ETH. Please confirm the transaction.`,
      })

      // Call depositStake to deposit stake
      const stakeWei = parseEther(stakeAmount)
      await depositStake(tempMatchId, stakeWei)

    } catch (error) {
      console.error('Stake deposit error:', error)
      toast({
        title: "Deposit Failed",
        description: "Failed to deposit stake. Please try again.",
        variant: "destructive"
      })
      setGameState("selecting")
    }
  }

  // When transaction is confirmed, move to waiting room
  useEffect(() => {
    console.log("Transaction State Check:", { matchCreated, gameState, isCreatingMatch });
    if (matchCreated && gameState === "paying") {
      console.log("✅ Transaction confirmed! Moving to waiting room...");
      toast({
        title: "Deposit Confirmed!",
        description: "Joining matchmaking queue...",
      })
      setGameState("waiting")
    }
  }, [matchCreated, gameState, toast, isCreatingMatch])

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game)
    setGameState("selecting")
  }

  const handleGameStart = useCallback((opponentAddress: string, gameMatchId: string) => {
    setOpponent(opponentAddress)
    setMatchId(gameMatchId)
    setGameState("playing")
  }, [])

  const handleBackToLobby = () => {
    setGameState("lobby")
    setSelectedGame(null)
    setStake("0.0001")
    setMatchId(null)
    setOpponent(null)
    setTxSignature(null)
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
        account={account}
        matchId={matchId}
        onGameStart={handleGameStart}
      />
    )
  }

  if (gameState === "paying") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Depositing Stake</h2>
          <p className="text-muted-foreground">Please confirm the transaction in your wallet...</p>
          <p className="text-sm text-muted-foreground mt-2">Depositing {stake} ETH</p>

          <button
            onClick={() => setGameState("selecting")}
            className="mt-6 text-sm text-red-500 hover:underline"
          >
            Cancel Transaction
          </button>
        </div>
      </div>
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
        <p className="text-lg text-muted-foreground">Compete 1v1 in skill-based games and win ETH</p>
      </div>
      {/* Game Selection */}
      <GameSelector onSelectGame={handleGameSelect} />
    </div>
  )
}
