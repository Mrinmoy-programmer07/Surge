"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGameState } from "@/lib/game-state-context"
import { useMatchApi } from "@/hooks/use-match-api"
import { useSurgeContract, useMatchData } from "@/hooks/use-surge-contract"
import { formatAddress } from "@/lib/game-utils"

interface PatternPredictorGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
  chainId: number
}

export default function PatternPredictorGame({ account, opponent, stake, matchId, chainId }: PatternPredictorGameProps) {
  const [gamePhase, setGamePhase] = useState<"display" | "input" | "opponent-turn" | "results">("display")
  const [pattern, setPattern] = useState<number[]>([])
  const [playerGuess, setPlayerGuess] = useState<number | null>(null)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [round, setRound] = useState(1)
  const [gameTime, setGameTime] = useState(15)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawn, setWithdrawn] = useState(false)
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null)
  const [blockchainMatchReady, setBlockchainMatchReady] = useState(false)
  const winnerSubmittedRef = useRef(false)

  const { updatePlayerScore, finishGame } = useGameState()
  const { withdraw, isWithdrawing, withdrawSuccess, withdrawHash, withdrawDraw, isWithdrawingDraw, withdrawDrawSuccess, withdrawDrawHash } = useSurgeContract()
  const {
    matchState,
    initializeMatch,
    submitScore: apiSubmitScore,
    submitWinner,
    error: apiError
  } = useMatchApi(matchId, account, chainId)

  const { data: blockchainMatch, refetch: refetchMatch } = useMatchData(matchId)

  useEffect(() => {
    if (gamePhase === "results" && !blockchainMatchReady) {
      const checkInterval = setInterval(async () => {
        const result = await refetchMatch()
        const match = result.data as any
        if (match && (match.status === 2 || match.status === 4)) {
          setBlockchainMatchReady(true)
          clearInterval(checkInterval)
        }
      }, 2000)
      return () => clearInterval(checkInterval)
    }
  }, [gamePhase, blockchainMatchReady, refetchMatch])

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

  // Handle withdrawal
  const handleWithdraw = async (isDraw: boolean = false) => {
    if (withdrawing || withdrawn || isWithdrawing || isWithdrawingDraw) return

    setWithdrawing(true)

    try {
      console.log('💰 Initiating smart contract withdrawal for match:', matchId, 'isDraw:', isDraw)

      if (isDraw) {
        withdrawDraw(matchId)
      } else {
        withdraw(matchId)
      }

      console.log('✅ Withdrawal transaction submitted to blockchain')

    } catch (error) {
      console.error('❌ Withdrawal error:', error)
      alert('Withdrawal failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      setWithdrawing(false)
    }
  }

  // Monitor withdrawal transaction status (normal win)
  useEffect(() => {
    if (withdrawSuccess && withdrawHash) {
      console.log('✅ Withdrawal confirmed on blockchain! Hash:', withdrawHash)
      setWithdrawn(true)
      setWithdrawTxHash(withdrawHash)
      setWithdrawing(false)

      fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          playerAddress: account,
          amount: (parseFloat(stake) * 2 * 0.75).toString(),
          stake: stake,
          platformFee: (parseFloat(stake) * 2 * 0.25).toString(),
          txHash: withdrawHash
        })
      }).catch(err => console.warn('Failed to record withdrawal in backend:', err))
    }
  }, [withdrawSuccess, withdrawHash, matchId, account, stake])

  // Monitor withdrawal transaction status (draw)
  useEffect(() => {
    if (withdrawDrawSuccess && withdrawDrawHash) {
      console.log('✅ Draw withdrawal confirmed on blockchain! Hash:', withdrawDrawHash)
      setWithdrawn(true)
      setWithdrawTxHash(withdrawDrawHash)
      setWithdrawing(false)

      fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          playerAddress: account,
          amount: stake,
          stake: stake,
          platformFee: '0',
          txHash: withdrawDrawHash
        })
      }).catch(err => console.warn('Failed to record withdrawal in backend:', err))
    }
  }, [withdrawDrawSuccess, withdrawDrawHash, matchId, account, stake])

  // Initialize match on mount
  useEffect(() => {
    initializeMatch(account, opponent, { patterns: PATTERNS })
  }, [matchId, account, opponent, initializeMatch])

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

  // Submit score when player finishes (opponent-turn phase)
  useEffect(() => {
    if (gamePhase === "opponent-turn" && !winnerSubmittedRef.current) {
      winnerSubmittedRef.current = true

      const submitPlayerScore = async () => {
        try {
          console.log('📤 Submitting player score:', playerScore)
          await apiSubmitScore(playerScore)
          console.log('✅ Player score submitted successfully')
        } catch (error) {
          console.error('❌ Failed to submit player score:', error)
        }
      }

      submitPlayerScore()
    }
  }, [gamePhase, playerScore, apiSubmitScore])

  // Track opponent score from matchState
  useEffect(() => {
    const isPlayer1 = matchState.player1 === account
    const opponentScore = isPlayer1 ? matchState.player2Score : matchState.player1Score

    if (opponentScore !== null && typeof opponentScore === 'number' && opponentScore >= 0) {
      console.log('✅ Updating opponent score from matchState:', opponentScore)
      setOpponentScore(opponentScore)

      // If we're in opponent-turn and got opponent's score, move to results
      if (gamePhase === "opponent-turn") {
        setGamePhase("results")
      }
    }
  }, [matchState.player1Score, matchState.player2Score, matchState.player1, account, gamePhase])

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

  // Track opponent score from matchState
  useEffect(() => {
    const isPlayer1 = matchState.player1 === account
    const opponentScore = isPlayer1 ? matchState.player2Score : matchState.player1Score

    if (opponentScore !== null && typeof opponentScore === 'number' && opponentScore >= 0) {
      console.log('✅ Updating opponent score from matchState:', opponentScore)
      setOpponentScore(opponentScore)

      // If we're in opponent-turn and got opponent's score, move to results
      if (gamePhase === "opponent-turn") {
        setGamePhase("results")
      }
    }
  }, [matchState.player1Score, matchState.player2Score, matchState.player1, account, gamePhase])

  const nextNumber =
    pattern.length >= 2 ? pattern[pattern.length - 1] + (pattern[pattern.length - 1] - pattern[pattern.length - 2]) : 0
  const winner = playerScore > opponentScore ? "You" : opponentScore > playerScore ? "Opponent" : "Draw"

  return (
    <div className="min-h-screen bg-background bg-cyber-grid py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 p-4 rounded-lg border border-primary/20 bg-card/50 backdrop-blur-sm">
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground uppercase mb-1">You</p>
            <p className="text-3xl font-bold text-primary text-glow-cyan">{playerScore}</p>
          </div>
          <div className="text-center flex-1">
            <h2 className="text-xl font-bold text-foreground">🔢 <span className="text-gradient-cyber">Pattern Predictor</span></h2>
            <p className="text-sm text-muted-foreground">Round {round}</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground uppercase mb-1">Opponent</p>
            <p className="text-3xl font-bold text-secondary">{opponentScore}</p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Player 1 - You */}
          <Card className="p-8 border-primary/20">
            <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
              <Badge variant="neon-cyan">Your Turn</Badge>
            </h3>

            {(gamePhase === "display" || gamePhase === "input") && (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">Find the next number:</p>
                  <div className="flex justify-center gap-2 mb-6">
                    {pattern.map((num, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 bg-primary/10 border-2 border-primary/50 rounded-lg flex items-center justify-center text-sm font-bold text-primary shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                      >
                        {num}
                      </div>
                    ))}
                    <div className="w-12 h-12 bg-warning/10 border-2 border-warning/50 rounded-lg flex items-center justify-center text-xl font-bold text-warning animate-pulse">
                      ?
                    </div>
                  </div>
                </div>

                {gamePhase === "input" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Badge variant={gameTime <= 5 ? 'destructive' : 'neon-orange'}>
                        ⏱️ {gameTime}s
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[nextNumber - 2, nextNumber - 1, nextNumber, nextNumber + 1, nextNumber + 2, nextNumber + 3].map(
                        (option) => (
                          <Button
                            key={option}
                            onClick={() => handleGuess(option)}
                            variant="outline"
                            className="aspect-square text-lg font-bold hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all"
                          >
                            {option}
                          </Button>
                        ),
                      )}
                    </div>

                    {feedback && (
                      <div
                        className={`text-center py-3 rounded-lg font-bold ${feedback === "correct"
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-destructive/20 text-destructive border border-destructive/30"
                          }`}
                      >
                        {feedback === "correct" ? "✓ Correct!" : "✗ Incorrect!"}
                      </div>
                    )}
                  </div>
                )}

                {gamePhase === "display" && (
                  <p className="text-center text-primary animate-pulse">Analyzing pattern...</p>
                )}
              </div>
            )}

            {gamePhase === "opponent-turn" && (
              <div className="text-center py-12">
                <div className="flex gap-1 justify-center mb-4">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-muted-foreground">Waiting for opponent...</p>
              </div>
            )}

            {gamePhase === "results" && (
              <div className="text-center py-12">
                <p className="text-5xl font-bold text-primary text-glow-cyan mb-2">{playerScore}</p>
                <p className="text-sm text-muted-foreground">Patterns solved</p>
              </div>
            )}
          </Card>

          {/* Player 2 - Opponent */}
          <Card className="p-8 border-secondary/20">
            <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
              <Badge variant="neon-pink">Opponent</Badge>
            </h3>

            {gamePhase === "opponent-turn" && (
              <div className="text-center py-12">
                <div className="flex gap-1 justify-center mb-4">
                  <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-muted-foreground">Playing...</p>
              </div>
            )}

            {gamePhase === "results" && (
              <div className="text-center py-12">
                <p className="text-5xl font-bold text-secondary mb-2">{opponentScore}</p>
                <p className="text-sm text-muted-foreground">Patterns solved</p>
              </div>
            )}

            {gamePhase !== "opponent-turn" && gamePhase !== "results" && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full border-2 border-secondary/30 bg-secondary/5 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-secondary text-xl">?</span>
                </div>
                <p className="text-muted-foreground">Waiting for you...</p>
              </div>
            )}
          </Card>
        </div>

        {/* Results */}
        {gamePhase === "results" && (
          <Card className={`p-8 text-center ${winner === 'You' ? 'border-accent/50' : winner === 'Draw' ? 'border-warning/50' : 'border-secondary/50'}`}>
            <h2 className={`text-4xl font-bold mb-4 ${winner === 'You' ? 'text-accent text-glow-green' : winner === 'Draw' ? 'text-warning' : 'text-secondary'}`}>
              {winner === "Draw" ? "It's a Draw!" : winner === "You" ? "🎉 Victory!" : "Defeat"}
            </h2>

            {!withdrawn && !withdrawTxHash && (
              <>
                {!blockchainMatchReady && (
                  <div className="mb-6">
                    <div className="relative mx-auto w-8 h-8 mb-3">
                      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                    </div>
                    <p className="text-sm text-muted-foreground">Syncing with blockchain...</p>
                  </div>
                )}

                {winner === "You" && (
                  <p className="text-xl font-bold text-accent text-glow-green mb-6">
                    💰 +{(parseFloat(stake) * 2 * 0.75).toFixed(4)} MNT
                  </p>
                )}

                <div className="flex gap-4 justify-center">
                  {winner === "You" && (
                    <Button
                      onClick={() => handleWithdraw(false)}
                      disabled={!blockchainMatchReady || isWithdrawing || withdrawing}
                      variant="neon-green"
                      size="lg"
                      className="shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                    >
                      {isWithdrawing || withdrawing ? "Processing..." : blockchainMatchReady ? "💎 Withdraw" : "⏳ Preparing..."}
                    </Button>
                  )}

                  {winner === "Draw" && (
                    <Button
                      onClick={() => handleWithdraw(true)}
                      disabled={!blockchainMatchReady || isWithdrawingDraw || withdrawing}
                      variant="neon-cyan"
                      size="lg"
                    >
                      {isWithdrawingDraw || withdrawing ? "Processing..." : blockchainMatchReady ? "↩️ Claim Stake" : "⏳ Preparing..."}
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => (window.location.href = "/")}>
                    Back to Lobby
                  </Button>
                </div>
              </>
            )}

            {(withdrawing || isWithdrawing || isWithdrawingDraw) && !withdrawn && (
              <div className="text-center py-4">
                <div className="relative mx-auto w-10 h-10 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                </div>
                <p className="text-muted-foreground">Confirming on blockchain...</p>
              </div>
            )}

            {withdrawn && withdrawTxHash && (
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-accent font-bold text-glow-green mb-2">✅ Withdrawal Successful!</p>
                <a
                  href={`https://sepolia.arbiscan.io/tx/${withdrawTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View on Explorer →
                </a>
                <div className="mt-4">
                  <Button onClick={() => (window.location.href = "/")} variant="neon-cyan">
                    Back to Lobby
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
