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

  const handleStakeConfirm = async (stakeAmount: string) => {
    setStake(stakeAmount)
    setGameState("waiting")
    
    // Request matchmaking
    try {
      const response = await fetch('/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerAddress: account,
          gameType: selectedGame,
          stake: stakeAmount
        })
      })
      
      const data = await response.json()
      
      if (data.matched) {
        // Immediate match found
        console.log('✅ Immediate match found:', data)
        setMatchId(data.matchId)
        setOpponent(data.opponent)
        setGameState("playing")
      } else {
        // Waiting for opponent, start polling
        console.log('⏳ Waiting for opponent...', data)
        setMatchId(data.matchId)
        startMatchmakingPoll(data.matchId)
      }
    } catch (error) {
      console.error('Matchmaking error:', error)
    }
  }
  
  const startMatchmakingPoll = (currentMatchId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/matchmaking?playerAddress=${account}`)
        const data = await response.json()
        
        if (data.matched) {
          console.log('✅ Match found via polling!')
          clearInterval(pollInterval)
          
          // Fetch the match details to get opponent
          const matchResponse = await fetch(`/api/matches/${currentMatchId}`)
          const matchData = await matchResponse.json()
          
          const opponentAddress = matchData.player1 === account ? matchData.player2 : matchData.player1
          setOpponent(opponentAddress)
          setGameState("playing")
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 2000) // Poll every 2 seconds
    
    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000)
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
