"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameState } from "@/lib/game-state-context"

interface MemoryMatchGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
}

const CARD_PAIRS = [
  { id: 1, emoji: "🎮" },
  { id: 2, emoji: "🎮" },
  { id: 3, emoji: "🚀" },
  { id: 4, emoji: "🚀" },
  { id: 5, emoji: "💎" },
  { id: 6, emoji: "💎" },
  { id: 7, emoji: "⚡" },
  { id: 8, emoji: "⚡" },
  { id: 9, emoji: "🔥" },
  { id: 10, emoji: "🔥" },
  { id: 11, emoji: "🌟" },
  { id: 12, emoji: "🌟" },
]

export default function MemoryMatchGame({ account, opponent, stake, matchId }: MemoryMatchGameProps) {
  const [gamePhase, setGamePhase] = useState<"playing" | "opponent-turn" | "results">("playing")
  const [cards, setCards] = useState<typeof CARD_PAIRS>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState<number[]>([])
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [playerTurns, setPlayerTurns] = useState(0)
  const [gameTime, setGameTime] = useState(60)

  const { updatePlayerScore, finishGame } = useGameState()

  useEffect(() => {
    const shuffled = [...CARD_PAIRS].sort(() => Math.random() - 0.5)
    setCards(shuffled)
  }, [])

  useEffect(() => {
    if (gamePhase !== "playing") return

    const timer = setInterval(() => {
      setGameTime((prev) => {
        if (prev <= 1) {
          setGamePhase("opponent-turn")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gamePhase])

  useEffect(() => {
    if (flipped.length !== 2) return

    const [first, second] = flipped
    if (cards[first].emoji === cards[second].emoji) {
      setMatched([...matched, first, second])
      setPlayerScore((prev) => prev + 1)
      setFlipped([])
    } else {
      setTimeout(() => {
        setFlipped([])
        setPlayerTurns((prev) => prev + 1)
      }, 1000)
    }
  }, [flipped, cards, matched])

  useEffect(() => {
    if (matched.length === cards.length && cards.length > 0) {
      setGamePhase("opponent-turn")
    }
  }, [matched, cards])

  useEffect(() => {
    if (gamePhase !== "opponent-turn") return

    const timer = setTimeout(() => {
      const simOpponentScore = Math.floor(Math.random() * (playerScore + 2))
      setOpponentScore(simOpponentScore)
      setGamePhase("results")
    }, 3000)

    return () => clearTimeout(timer)
  }, [gamePhase, playerScore])

  useEffect(() => {
    if (gamePhase === "results") {
      updatePlayerScore("player1", playerScore)
      const winner = playerScore > opponentScore ? account : opponent
      finishGame(winner)
    }
  }, [gamePhase, playerScore, opponentScore, account, opponent, updatePlayerScore, finishGame])

  const handleCardClick = (index: number) => {
    if (gamePhase !== "playing" || flipped.includes(index) || matched.includes(index)) return
    if (flipped.length >= 2) return

    setFlipped([...flipped, index])
  }

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
            <p className="text-lg font-bold text-foreground">Memory Match Showdown</p>
            <p className="text-sm text-muted-foreground">Time: {gameTime}s</p>
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

            {gamePhase === "playing" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {cards.map((card, index) => (
                    <button
                      key={index}
                      onClick={() => handleCardClick(index)}
                      className={`aspect-square rounded-lg font-bold text-2xl transition-all ${
                        flipped.includes(index) || matched.includes(index)
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border hover:border-primary cursor-pointer"
                      }`}
                    >
                      {flipped.includes(index) || matched.includes(index) ? card.emoji : "?"}
                    </button>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground">Pairs found: {playerScore}</p>
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
                <p className="text-muted-foreground">Pairs matched</p>
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
                <p className="text-muted-foreground">Pairs matched</p>
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
