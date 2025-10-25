"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameState } from "@/lib/game-state-context"

interface ReflexWarGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
}

export default function ReflexWarGame({ account, opponent, stake, matchId }: ReflexWarGameProps) {
  const [gamePhase, setGamePhase] = useState<"waiting" | "active" | "opponent-turn" | "results">("waiting")
  const [playerReactionTime, setPlayerReactionTime] = useState<number | null>(null)
  const [opponentReactionTime, setOpponentReactionTime] = useState<number | null>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [round, setRound] = useState(1)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [roundsPlayed, setRoundsPlayed] = useState(0)

  const { updatePlayerScore, finishGame } = useGameState()

  useEffect(() => {
    const timer = setTimeout(() => {
      setGamePhase("active")
      setStartTime(Date.now())
      setGameStarted(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleClick = () => {
    if (gamePhase !== "active" || !startTime) return

    const reactionTime = Date.now() - startTime
    setPlayerReactionTime(reactionTime)
    setGamePhase("opponent-turn")
  }

  useEffect(() => {
    if (gamePhase !== "opponent-turn") return

    const timer = setTimeout(() => {
      const simOpponentTime = Math.floor(Math.random() * 500) + 100
      setOpponentReactionTime(simOpponentTime)

      if (playerReactionTime && playerReactionTime < simOpponentTime) {
        setPlayerScore((prev) => prev + 1)
      } else {
        setOpponentScore((prev) => prev + 1)
      }

      setRoundsPlayed((prev) => prev + 1)

      if (roundsPlayed + 1 >= 5) {
        setGamePhase("results")
      } else {
        setTimeout(() => {
          setRound((prev) => prev + 1)
          setPlayerReactionTime(null)
          setOpponentReactionTime(null)
          setGamePhase("waiting")
          setStartTime(null)
          setGameStarted(false)

          setTimeout(() => {
            setGamePhase("active")
            setStartTime(Date.now())
            setGameStarted(true)
          }, 2000)
        }, 2000)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [gamePhase, playerReactionTime, roundsPlayed])

  useEffect(() => {
    if (gamePhase === "results") {
      updatePlayerScore("player1", playerScore)
      const winner = playerScore > opponentScore ? account : opponent
      finishGame(winner)
    }
  }, [gamePhase, playerScore, opponentScore, account, opponent, updatePlayerScore, finishGame])

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
            <p className="text-lg font-bold text-foreground">Reflex War</p>
            <p className="text-sm text-muted-foreground">Round {round} / 5</p>
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

            {gamePhase === "waiting" && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Get ready...</p>
                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl">⏳</span>
                </div>
              </div>
            )}

            {gamePhase === "active" && (
              <div className="text-center py-12">
                <Button
                  onClick={handleClick}
                  className="w-full h-32 bg-primary hover:bg-primary/90 text-primary-foreground text-2xl font-bold rounded-xl"
                >
                  CLICK!
                </Button>
                <p className="text-muted-foreground mt-4">Click as fast as you can!</p>
              </div>
            )}

            {gamePhase === "opponent-turn" && playerReactionTime && (
              <div className="text-center py-12">
                <p className="text-4xl font-bold text-primary mb-2">{playerReactionTime}ms</p>
                <p className="text-muted-foreground">Your reaction time</p>
              </div>
            )}

            {gamePhase === "results" && (
              <div className="text-center py-12">
                <p className="text-4xl font-bold text-primary mb-2">{playerScore}</p>
                <p className="text-muted-foreground">Rounds won</p>
              </div>
            )}
          </Card>

          {/* Player 2 - Opponent */}
          <Card className="p-8 border-border">
            <h3 className="text-lg font-bold mb-6 text-foreground">Opponent</h3>

            {gamePhase === "opponent-turn" && opponentReactionTime && (
              <div className="text-center py-12">
                <p className="text-4xl font-bold text-secondary mb-2">{opponentReactionTime}ms</p>
                <p className="text-muted-foreground">Opponent reaction time</p>
              </div>
            )}

            {gamePhase === "results" && (
              <div className="text-center py-12">
                <p className="text-4xl font-bold text-secondary mb-2">{opponentScore}</p>
                <p className="text-muted-foreground">Rounds won</p>
              </div>
            )}

            {gamePhase !== "opponent-turn" && gamePhase !== "results" && (
              <div className="text-center py-12 text-muted-foreground">Waiting for your turn...</div>
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
