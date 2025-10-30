"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameState } from "@/lib/game-state-context"

interface PatternPredictorGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
}

export default function PatternPredictorGame({ account, opponent, stake, matchId }: PatternPredictorGameProps) {
  const [gamePhase, setGamePhase] = useState<"display" | "input" | "opponent-turn" | "results">("display")
  const [pattern, setPattern] = useState<number[]>([])
  const [playerGuess, setPlayerGuess] = useState<number | null>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameTime, setGameTime] = useState(15)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)

  const { updatePlayerScore, finishGame } = useGameState()

  const PATTERNS = [
    [2, 4, 6, 8, 10], // Even numbers
    [1, 3, 5, 7, 9], // Odd numbers
    [1, 2, 4, 8, 16], // Powers of 2
    [1, 1, 2, 3, 5], // Fibonacci
    [5, 10, 15, 20, 25], // Multiples of 5
    [100, 90, 80, 70, 60], // Decreasing by 10
    [3, 6, 9, 12, 15], // Multiples of 3
    [1, 4, 9, 16, 25], // Perfect squares
  ]

  useEffect(() => {
    const randomPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)]
    setPattern(randomPattern)
    setGamePhase("display")
  }, [])

  useEffect(() => {
    if (gamePhase === "display") {
      const timer = setTimeout(() => {
        setGamePhase("input")
        setGameTime(15)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gamePhase])

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
      const winner = playerScore > opponentScore ? account : opponent
      finishGame(winner)
    }
  }, [gamePhase, playerScore, opponentScore, account, opponent, updatePlayerScore, finishGame])

  const handleGuess = (guess: number) => {
    const nextNumber = pattern[pattern.length - 1] + (pattern[pattern.length - 1] - pattern[pattern.length - 2])
    const isCorrect = guess === nextNumber

    setPlayerGuess(guess)
    setFeedback(isCorrect ? "correct" : "incorrect")

    if (isCorrect) {
      setPlayerScore((prev) => prev + 1)
    }

    setTimeout(() => {
      setGamePhase("opponent-turn")
    }, 1500)
  }

  const handleTimeUp = () => {
    setGamePhase("opponent-turn")
  }

  useEffect(() => {
    if (gamePhase !== "opponent-turn") return

    const timer = setTimeout(() => {
      const simOpponentScore = Math.floor(Math.random() * (playerScore + 2))
      setOpponentScore(simOpponentScore)
      setGamePhase("results")
    }, 3000)

    return () => clearTimeout(timer)
  }, [gamePhase, playerScore])

  const nextNumber =
    pattern.length >= 2 ? pattern[pattern.length - 1] + (pattern[pattern.length - 1] - pattern[pattern.length - 2]) : 0
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
            <p className="text-lg font-bold text-foreground">Pattern Predictor</p>
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

            {(gamePhase === "display" || gamePhase === "input") && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Find the next number in the pattern:</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {pattern.map((num, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 bg-primary/20 border border-primary rounded-lg flex items-center justify-center text-sm font-bold text-primary"
                      >
                        {num}
                      </div>
                    ))}
                    <div className="w-12 h-12 bg-muted border border-border rounded-lg flex items-center justify-center text-sm font-bold text-muted-foreground">
                      ?
                    </div>
                  </div>
                </div>

                {gamePhase === "input" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Time: {gameTime}s</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[nextNumber - 2, nextNumber - 1, nextNumber, nextNumber + 1, nextNumber + 2, nextNumber + 3].map(
                        (option) => (
                          <Button
                            key={option}
                            onClick={() => handleGuess(option)}
                            className="aspect-square bg-card hover:bg-primary hover:text-primary-foreground border border-border text-foreground font-bold"
                            variant="outline"
                          >
                            {option}
                          </Button>
                        ),
                      )}
                    </div>

                    {feedback && (
                      <div
                        className={`text-center py-2 rounded-lg font-bold ${
                          feedback === "correct" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                        }`}
                      >
                        {feedback === "correct" ? "Correct!" : "Incorrect!"}
                      </div>
                    )}
                  </div>
                )}

                {gamePhase === "display" && <p className="text-center text-muted-foreground">Analyzing pattern...</p>}
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
                <p className="text-muted-foreground">Patterns predicted</p>
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
                <p className="text-muted-foreground">Patterns predicted</p>
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
