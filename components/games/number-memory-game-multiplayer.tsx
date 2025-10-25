"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateNumberSequence, calculateScore } from "@/lib/game-utils"
import { useMultiplayerGame } from "@/hooks/use-multiplayer-game"
import { formatAddress } from "@/lib/game-utils"

interface NumberMemoryGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
}

export default function NumberMemoryGame({ account, opponent, stake, matchId }: NumberMemoryGameProps) {
  const [gamePhase, setGamePhase] = useState<"display" | "input" | "waiting" | "results">("display")
  const [sequence, setSequence] = useState<number[]>([])
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [displayIndex, setDisplayIndex] = useState(0)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [localPlayerScore, setLocalPlayerScore] = useState(0)
  const [scrambledInputs, setScrambledInputs] = useState<number[]>([])

  const { 
    gameState, 
    isConnected, 
    submitTurn, 
    updateScore, 
    endGame 
  } = useMultiplayerGame()

  // Function to scramble the sequence for input buttons
  const scrambleSequence = (seq: number[]): number[] => {
    const scrambled = [...seq]
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]]
    }
    return scrambled
  }

  // Initialize game with synchronized sequence
  useEffect(() => {
    if (gameState.matchId === matchId && gameState.gameData.sequence) {
      setSequence(gameState.gameData.sequence)
      setScrambledInputs(scrambleSequence(gameState.gameData.sequence))
    } else if (gameState.matchId === matchId && gameState.status === 'in_progress' && !gameState.gameData.sequence) {
      const newSequence = generateNumberSequence(5)
      setSequence(newSequence)
      setScrambledInputs(scrambleSequence(newSequence))
      updateScore(matchId, 0, { sequence: newSequence })
    } else if (!gameState.matchId && sequence.length === 0) {
      const newSequence = generateNumberSequence(5)
      setSequence(newSequence)
      setScrambledInputs(scrambleSequence(newSequence))
    }
  }, [gameState, matchId, updateScore, sequence.length])

  // Turn management
  useEffect(() => {
    if (gameState.matchId === matchId && gameState.status === 'in_progress') {
      const shouldBeMyTurn = gameState.currentPlayer === account
      setIsMyTurn(shouldBeMyTurn)
    }
  }, [gameState, matchId, account])

  // Display sequence animation
  useEffect(() => {
    if (gamePhase !== "display" || displayIndex >= sequence.length) return

    const timer = setTimeout(() => {
      setDisplayIndex((prev) => prev + 1)
    }, 800)

    return () => clearTimeout(timer)
  }, [gamePhase, displayIndex, sequence])

  // Move to input phase after display
  useEffect(() => {
    if (gamePhase === "display" && displayIndex === sequence.length && sequence.length > 0) {
      setGamePhase("input")
      setDisplayIndex(0)
      
      if (!gameState.matchId || !gameState.currentPlayer) {
        setIsMyTurn(true)
      } else if (gameState.currentPlayer === account) {
        setIsMyTurn(true)
      } else {
        setIsMyTurn(false)
      }
    }
  }, [displayIndex, gamePhase, sequence, gameState, matchId, account])

  // Check for game over
  useEffect(() => {
    if (gameState.matchId === matchId && gameState.status === 'finished') {
      setGamePhase("results")
    }
  }, [gameState, matchId])

  const handleNumberClick = (num: number) => {
    if (gamePhase !== "input" || !isMyTurn) return

    const newInput = [...playerInput, num]
    setPlayerInput(newInput)

    // Check if correct
    if (sequence[newInput.length - 1] !== num) {
      const score = calculateScore(sequence, newInput)
      setLocalPlayerScore(score)
      
      if (gameState.matchId) {
        updateScore(matchId, score)
        submitTurn(matchId, { playerInput: newInput, score })
        endGame(matchId, opponent, { playerInput: newInput, score })
      }
      
      setPlayerInput([])
      setGamePhase("results")
    } else if (newInput.length === sequence.length) {
      const score = sequence.length
      setLocalPlayerScore(score)
      
      if (gameState.matchId) {
        updateScore(matchId, score)
        submitTurn(matchId, { playerInput: newInput, score })
        endGame(matchId, account, { playerInput: newInput, score })
      }
      
      setPlayerInput([])
      setGamePhase("results")
    }
  }

  // Get real scores from game state - determine which player is which
  const isPlayer1 = gameState.player1 === account
  const myScore = isPlayer1 ? (gameState.player1Score || localPlayerScore) : (gameState.player2Score || localPlayerScore)
  const opponentScore = isPlayer1 ? (gameState.player2Score || 0) : (gameState.player1Score || 0)
  
  // Debug logging
  console.log('🎮 Game State Debug:', {
    gameState: gameState,
    account: account,
    isPlayer1: isPlayer1,
    myScore: myScore,
    opponentScore: opponentScore,
    localPlayerScore: localPlayerScore
  })

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Connecting to Game...</h2>
            <p className="text-muted-foreground mb-4">Please wait while we establish the game connection.</p>
          </Card>
        </div>
      </div>
    )
  }

  if (gamePhase === "results") {
    const winnerAddress = gameState?.winner
    const isWinner = winnerAddress === account
    const winnerText = isWinner ? "You Win!" : winnerAddress === opponent ? "Opponent Wins!" : "It's a Draw!"

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-4xl font-bold mb-4 text-center text-foreground">{winnerText}</h2>
            <p className="text-xl text-center text-muted-foreground mb-4">
              Final Score: {myScore} - {opponentScore}
            </p>
            <div className="text-sm text-muted-foreground mb-8">
              <p>Your Score: {myScore} | Opponent Score: {opponentScore}</p>
              <p>Game State: {gameState.status} | Winner: {gameState.winner || 'TBD'}</p>
            </div>
            <div className="flex justify-center">
              <Button onClick={() => window.location.reload()} className="px-8 py-4 text-lg">
                Play Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Number Memory</h2>

          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div>
              <p className="text-lg text-muted-foreground">Your Score</p>
              <p className="text-4xl font-bold text-primary">{myScore}</p>
              <p className="text-xs text-muted-foreground">Local: {localPlayerScore}</p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">Opponent Score</p>
              <p className="text-4xl font-bold text-secondary">{opponentScore}</p>
              <p className="text-xs text-muted-foreground">Server: {gameState.player1Score || gameState.player2Score || 'N/A'}</p>
            </div>
          </div>

          {gamePhase === "display" && (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg mb-8">
              <p className="text-6xl font-bold text-foreground animate-fade-in">
                {sequence[displayIndex]}
              </p>
            </div>
          )}

          {gamePhase === "waiting" && (
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {isMyTurn ? "Your turn!" : "Waiting for opponent..."}
              </h2>
              {isMyTurn && (
                <p className="text-muted-foreground">Click the numbers in the correct order as they appeared</p>
              )}
            </div>
          )}

          {gamePhase === "input" && isMyTurn && (
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-4">Your turn!</h2>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Click the numbers in the correct order as they appeared</p>
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Remember this sequence:</p>
                  <div className="flex justify-center gap-2">
                    {sequence.map((num, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-bold"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Number Grid */}
              <div className="grid grid-cols-5 gap-4 max-w-md mx-auto mb-4">
                {scrambledInputs.map((num, index) => (
                  <Button
                    key={`${num}-${index}`}
                    onClick={() => handleNumberClick(num)}
                    className="w-16 h-16 text-xl font-bold"
                    variant="outline"
                  >
                    {num}
                  </Button>
                ))}
              </div>

              {/* Current Input */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Your input:</p>
                <div className="flex justify-center gap-2">
                  {playerInput.map((num, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-bold"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gamePhase === "input" && !isMyTurn && (
            <div className="flex items-center justify-center h-48 bg-muted rounded-lg mb-8">
              <p className="text-2xl font-semibold text-muted-foreground animate-pulse">
                Waiting for opponent's input...
              </p>
            </div>
          )}

          {/* Connection Status */}
          <div className="text-center text-sm text-muted-foreground">
            <div className={`inline-flex items-center px-3 py-1 rounded-full ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            {isMyTurn && gamePhase === "input" && (
              <span className="ml-4 text-blue-600">• Your Turn</span>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}