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
import { useChainId } from "wagmi"
import PopArtTitle from "@/components/ui/pop-art-title"
import { Card } from "@/components/ui/card"
import { Swords, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GameLobbyProps {
  account: string
  onDisconnect?: () => void
}

export default function GameLobby({ account, onDisconnect }: GameLobbyProps) {
  const [gameState, setGameState] = useState<"mode-select" | "lobby" | "selecting" | "paying" | "waiting" | "playing">("mode-select")
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [stake, setStake] = useState<string>("0.0001")
  const [matchId, setMatchId] = useState<string | null>(null)
  const [opponent, setOpponent] = useState<string | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const { toast } = useToast()
  const { depositStake, isCreatingMatch, matchCreated, createMatchError } = useSurgeContract()
  const chainId = useChainId()

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
    setGameState("mode-select")
    setSelectedGame(null)
    setStake("0.0001")
    setMatchId(null)
    setOpponent(null)
    setTxSignature(null)
  }

  if (gameState === "playing" && selectedGame && matchId && opponent) {
    const gameProps = { account, opponent, stake, matchId, chainId }
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
        <div className="relative p-8 rounded-2xl bg-black/80 backdrop-blur-xl border border-primary/30 shadow-[0_0_40px_rgba(0,240,255,0.15)] max-w-md w-full mx-4">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="text-center">
            {/* Animated spinner */}
            <div className="relative mx-auto mb-6 w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-accent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            <h2 className="text-3xl font-black mb-3 text-white tracking-tight">
              Depositing Stake
            </h2>

            <p className="text-muted-foreground mb-2">
              Please confirm the transaction in your wallet...
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 mt-6">
              <span className="text-accent font-bold text-lg">{stake} ETH</span>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setGameState("selecting")}
                className="px-6 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all border border-red-500/30 hover:border-red-500/50"
              >
                Cancel Transaction
              </button>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-secondary to-transparent" />
        </div>
      </div>
    )
  }

  if (gameState === "selecting" && selectedGame) {
    return <StakeSelector game={selectedGame} onConfirm={handleStakeConfirm} onBack={() => setGameState("lobby")} />
  }

  // Mode Selection (1v1 vs Play with Friends)
  if (gameState === "mode-select") {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center mb-12">
          <PopArtTitle>SELECT GAME MODE</PopArtTitle>
          <p className="text-lg text-muted-foreground mt-6">
            Choose how you want to compete
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* 1v1 Card */}
          <Card
            onClick={() => setGameState("lobby")}
            className="mode-card group relative p-8 border-2 border-primary/30 bg-black/60 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:scale-[1.02]"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Swords className="w-10 h-10 text-primary" />
              </div>

              <h3 className="text-3xl font-black text-white tracking-wide">1v1</h3>
              <p className="text-muted-foreground">Battle random opponents in skill-based games and win ETH</p>

              <div className="mt-4 px-6 py-2 bg-primary/20 rounded-full text-primary text-sm font-bold uppercase tracking-widest group-hover:bg-primary group-hover:text-black transition-all">
                Play Now →
              </div>
            </div>
          </Card>

          {/* Play with Friends Card - Coming Soon */}
          <Card
            className="mode-card relative p-8 border-2 border-border/30 bg-black/40 backdrop-blur-xl opacity-60 cursor-not-allowed"
          >
            {/* Coming Soon Banner */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-secondary/80 rounded-full">
              <span className="text-xs font-bold uppercase tracking-widest text-white">Coming Soon</span>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>

              <h3 className="text-3xl font-black text-muted-foreground tracking-wide">PLAY WITH FRIENDS</h3>
              <p className="text-muted-foreground/60">Invite friends to private matches and compete head-to-head</p>

              <div className="mt-4 px-6 py-2 bg-muted/20 rounded-full text-muted-foreground text-sm font-bold uppercase tracking-widest">
                Soon™
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Game Selection (Lobby)
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setGameState("mode-select")}
        className="mb-4 hover:bg-primary/10 hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Mode Selection
      </Button>

      {/* Hero Section - Pop Art Style */}
      <div className="text-center mb-12">
        <PopArtTitle>Choose Your Challenge</PopArtTitle>
        <p className="text-lg text-muted-foreground mt-6">
          Compete <span className="text-primary font-semibold">1v1</span> in skill-based games and win <span className="text-warning font-semibold">ETH</span>
        </p>
      </div>
      {/* Game Selection */}
      <GameSelector onSelectGame={handleGameSelect} />
    </div>
  )
}
