"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateNumberSequence, calculateScore } from "@/lib/game-utils"
import { useGameState } from "@/lib/game-state-context"

interface NumberMemoryGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
}

export default function NumberMemoryGame({ account, opponent, stake, matchId }: NumberMemoryGameProps) {
  const [gamePhase, setGamePhase] = useState<"display" | "input" | "opponent-turn" | "results">("display")
  const [sequence, setSequence] = useState<number[]>([])
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [round, setRound] = useState(1)
  const [displayIndex, setDisplayIndex] = useState(0)
  const [gameTime, setGameTime] = useState(30)

  const { updatePlayerScore, finishGame } = useGameState()

  // Initialize game
  useEffect(() => {
    const newSequence = generateNumberSequence(5)
    setSequence(newSequence)
  }, [])

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
    }
  }, [displayIndex, gamePhase, sequence])

  // Game timer
  useEffect(() => {
    if (gamePhase !== "input") return

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase])

  useEffect(() => {
    if (gamePhase === "results") {
      updatePlayerScore("player1", playerScore)
    }
  }, [playerScore, gamePhase, updatePlayerScore])

  useEffect(() => {
    if (gamePhase === "results") {
      const winner = playerScore > opponentScore ? account : opponent
      finishGame(winner)
    }
  }, [gamePhase, playerScore, opponentScore, account, opponent, finishGame])

  const handleNumberClick = (num: number) => {
    if (gamePhase !== "input") return

    const newInput = [...playerInput, num]
    setPlayerInput(newInput)

    // Check if correct
    if (sequence[newInput.length - 1] !== num) {
      // Wrong number - end turn
      const score = calculateScore(sequence, newInput)
      setPlayerScore(score)
      setGamePhase("opponent-turn")
      setGameTime(30)
      setPlayerInput([])
    } else if (newInput.length === sequence.length) {
      // Completed sequence
      setPlayerScore(sequence.length)
      setGamePhase("opponent-turn")
      setGameTime(30)
      setPlayerInput([])
    }
  }

  const handleTimeUp = () => {
    const score = calculateScore(sequence, playerInput)
    setPlayerScore(score)
    setGamePhase("opponent-turn")
    setGameTime(30)
    setPlayerInput([])
  }

  // Simulate opponent turn
  useEffect(() => {
    if (gamePhase !== "opponent-turn") return

    const timer = setTimeout(() => {
      // Simulate opponent score (random between 0 and player score)
      const simOpponentScore = Math.floor(Math.random() * (playerScore + 1))
      setOpponentScore(simOpponentScore)
      setGamePhase("results")
    }, 3000)

    return () => clearTimeout(timer)
  }, [gamePhase, playerScore])

  const winner = playerScore > opponentScore ? "You" : opponentScore > playerScore ? "Opponent" : "Draw"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground mb-1">You</p>
            <p className="text-2xl font-bold text-primary">{playerScore}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold text-foreground">Number Memory Battle</p>
            <p className="text-sm text-muted-foreground">Round {round}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-sm text-muted-foreground mb-1">Opponent</p>
            <p className="text-2xl font-bold text-secondary">{opponentScore}</p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Player 1 - You */}
          <Card className="p-8 border-border">
            <h3 className="text-lg font-bold mb-6 text-foreground">Your Turn</h3>

            {gamePhase === "display" && (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground mb-8">Watch the sequence...</p>
                <div className="grid grid-cols-5 gap-2">
                  {sequence.map((num, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-all ${
                        idx < displayIndex
                          ? "bg-primary text-primary-foreground scale-95"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gamePhase === "input" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-muted-foreground">Time: {gameTime}s</p>
                  <p className="text-sm text-muted-foreground">
                    {playerInput.length} / {sequence.length}
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {playerInput.map((num, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg flex items-center justify-center text-2xl font-bold bg-primary text-primary-foreground"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, num) => (
                    <Button
                      key={num}
                      onClick={() => handleNumberClick(num)}
                      className="aspect-square bg-card hover:bg-primary hover:text-primary-foreground border border-border text-foreground font-bold text-lg"
                      variant="outline"
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {gamePhase === "opponent-turn" && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Opponent is playing...</p>
                <div className="inline-block">
                  <div className="animate-spin">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
            )}

            {gamePhase === "results" && (
              <div className="text-center py-12">
                <p className="text-4xl font-bold text-primary mb-2">{playerScore}</p>
                <p className="text-muted-foreground">Numbers remembered</p>
              </div>
            )}
          </Card>

          {/* Player 2 - Opponent */}
          <Card className="p-8 border-border">
            <h3 className="text-lg font-bold mb-6 text-foreground">Opponent</h3>

            {gamePhase === "opponent-turn" && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Playing...</p>
                <div className="inline-block">
                  <div className="animate-spin">
                    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
            )}

            {gamePhase === "results" && (
              <div className="text-center py-12">
                <p className="text-4xl font-bold text-secondary mb-2">{opponentScore}</p>
                <p className="text-muted-foreground">Numbers remembered</p>
              </div>
            )}

            {gamePhase !== "opponent-turn" && gamePhase !== "results" && (
              <div className="text-center py-12 text-muted-foreground">Waiting for your turn to complete...</div>
            )}
          </Card>
        </div>

        {/* Results */}
        {gamePhase === "results" && (
          <Card className="p-8 border-border text-center">
            <h2 className="text-3xl font-bold mb-4 text-foreground">
              {winner === "Draw" ? "It's a Draw!" : `${winner} Won!`}
            </h2>
            <p className="text-muted-foreground mb-8">
              {winner === "You"
                ? `You won ${stake} cUSD!`
                : winner === "Opponent"
                  ? `You lost ${stake} cUSD`
                  : "No winner this round"}
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Play Again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="border-border hover:bg-card"
              >
                Back to Lobby
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
