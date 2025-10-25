"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameState } from "@/lib/game-state-context"

interface WordScrambleGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
}

const WORD_LIST = [
  { word: "JAVASCRIPT", scrambled: "TSCRIPJAVA" },
  { word: "BLOCKCHAIN", scrambled: "CHAINBLOCK" },
  { word: "ETHEREUM", scrambled: "UMETHARE" },
  { word: "DEVELOPER", scrambled: "OPERDEVEL" },
  { word: "ALGORITHM", scrambled: "RITHMOLOG" },
  { word: "DATABASE", scrambled: "BASEDATAB" },
  { word: "NETWORK", scrambled: "WORKNETNE" },
  { word: "SECURITY", scrambled: "URITYSEC" },
]

export default function WordScrambleGame({ account, opponent, stake, matchId }: WordScrambleGameProps) {
  const [gamePhase, setGamePhase] = useState<"display" | "input" | "opponent-turn" | "results">("display")
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [playerInput, setPlayerInput] = useState("")
  const [gameTime, setGameTime] = useState(30)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const [wordsCompleted, setWordsCompleted] = useState(0)

  const { updatePlayerScore, finishGame } = useGameState()

  useEffect(() => {
    setGamePhase("display")
  }, [])

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
    if (gamePhase === "display") {
      const timer = setTimeout(() => {
        setGamePhase("input")
        setGameTime(30)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [gamePhase])

  useEffect(() => {
    if (gamePhase === "results") {
      updatePlayerScore("player1", playerScore)
      const winner = playerScore > opponentScore ? account : opponent
      finishGame(winner)
    }
  }, [gamePhase, playerScore, opponentScore, account, opponent, updatePlayerScore, finishGame])

  const handleSubmit = () => {
    const currentWord = WORD_LIST[currentWordIndex]
    const isCorrect = playerInput.toUpperCase() === currentWord.word

    if (isCorrect) {
      setFeedback("correct")
      setPlayerScore((prev) => prev + 1)
      setWordsCompleted((prev) => prev + 1)

      if (currentWordIndex < WORD_LIST.length - 1) {
        setTimeout(() => {
          setCurrentWordIndex((prev) => prev + 1)
          setPlayerInput("")
          setFeedback(null)
          setGameTime(30)
        }, 1000)
      } else {
        setTimeout(() => {
          setGamePhase("opponent-turn")
        }, 1000)
      }
    } else {
      setFeedback("incorrect")
      setTimeout(() => {
        setGamePhase("opponent-turn")
      }, 1500)
    }
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

  const currentWord = WORD_LIST[currentWordIndex]
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
            <p className="text-lg font-bold text-foreground">Word Scramble Duel</p>
            <p className="text-sm text-muted-foreground">
              {wordsCompleted} / {WORD_LIST.length}
            </p>
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
                  <p className="text-sm text-muted-foreground mb-4">Unscramble the word:</p>
                  <p className="text-4xl font-bold tracking-widest text-primary mb-4 font-mono">
                    {currentWord.scrambled}
                  </p>
                </div>

                {gamePhase === "input" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Time: {gameTime}s</p>
                      <p className="text-sm text-muted-foreground">
                        Word {currentWordIndex + 1} of {WORD_LIST.length}
                      </p>
                    </div>
                    <input
                      type="text"
                      value={playerInput}
                      onChange={(e) => setPlayerInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder="Type your answer..."
                      className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                    <Button
                      onClick={handleSubmit}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Submit
                    </Button>

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

                {gamePhase === "display" && <p className="text-center text-muted-foreground">Get ready...</p>}
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
                <p className="text-muted-foreground">Words unscrambled</p>
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
                <p className="text-muted-foreground">Words unscrambled</p>
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
