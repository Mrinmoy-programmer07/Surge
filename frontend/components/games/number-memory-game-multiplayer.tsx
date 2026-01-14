"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateNumberSequence, calculateScore } from "@/lib/game-utils"
import { useMatchApi } from "@/hooks/use-match-api"
import { formatAddress } from "@/lib/game-utils"
import { useSurgeContract } from "@/hooks/use-surge-contract"
import GameResultCard from "@/components/ui/game-result-card"

interface NumberMemoryGameProps {
  account: string
  opponent: string
  stake: string
  matchId: string
  chainId: number
}

export default function NumberMemoryGame({ account, opponent, stake, matchId, chainId }: NumberMemoryGameProps) {
  const [gamePhase, setGamePhase] = useState<"display" | "input" | "waiting" | "results">("display")
  const [sequence, setSequence] = useState<number[]>([])
  const [playerInput, setPlayerInput] = useState<number[]>([])
  const [displayIndex, setDisplayIndex] = useState(0)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [myFinalScore, setMyFinalScore] = useState<number | null>(null)
  const [opponentFinalScore, setOpponentFinalScore] = useState<number | null>(null)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingTimer, setWaitingTimer] = useState<number>(5)
  const [inputTimeLeft, setInputTimeLeft] = useState<number>(15) // 15 second countdown
  const winnerSubmittedRef = useRef(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawn, setWithdrawn] = useState(false)
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null)

  const { withdraw, isWithdrawing, withdrawSuccess, withdrawHash, withdrawDraw, isWithdrawingDraw, withdrawDrawSuccess, withdrawDrawHash } = useSurgeContract()

  const {
    matchState,
    initializeMatch,
    submitScore: apiSubmitScore,
    submitWinner,
    error: apiError
  } = useMatchApi(matchId, account, chainId)

  // Full 0-9 keypad for input (no hints - harder!)
  const fullKeypad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

  // Handle withdrawal
  const handleWithdraw = async (isDraw: boolean = false) => {
    if (withdrawing || withdrawn || isWithdrawing || isWithdrawingDraw) return

    setWithdrawing(true)

    try {
      console.log('💰 Initiating smart contract withdrawal for match:', matchId, 'isDraw:', isDraw)

      // Call the appropriate withdraw function
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

      // Optional: Record withdrawal in backend for tracking
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

      // Optional: Record withdrawal in backend for tracking
      fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          playerAddress: account,
          amount: stake, // Full stake returned on draw
          stake: stake,
          platformFee: '0', // No fee on draws
          txHash: withdrawDrawHash
        })
      }).catch(err => console.warn('Failed to record withdrawal in backend:', err))
    }
  }, [withdrawDrawSuccess, withdrawDrawHash, matchId, account, stake])

  // Initialize match on mount - 8 digits for harder difficulty
  useEffect(() => {
    const newSequence = generateNumberSequence(8) // Increased from 5 to 8
    setSequence(newSequence)

    // Initialize match in API
    initializeMatch(account, opponent, { sequence: newSequence })
  }, [matchId, account, opponent, initializeMatch])

  // Turn management - both players can play simultaneously
  useEffect(() => {
    if (matchState.status === 'in_progress') {
      setIsMyTurn(true)
    }
  }, [matchState.status])

  // Display sequence animation - 500ms per digit (faster = harder)
  useEffect(() => {
    if (gamePhase !== "display" || displayIndex >= sequence.length) return

    const timer = setTimeout(() => {
      setDisplayIndex((prev) => prev + 1)
    }, 500) // Reduced from 800ms to 500ms

    return () => clearTimeout(timer)
  }, [gamePhase, displayIndex, sequence])

  // Move to input phase after display
  useEffect(() => {
    if (gamePhase === "display" && displayIndex === sequence.length && sequence.length > 0) {
      setTimeout(() => {
        setGamePhase("input")
        setDisplayIndex(0)
        setIsMyTurn(true)
        setInputTimeLeft(15) // Reset countdown timer
      }, 500) // Small delay before input phase
    }
  }, [displayIndex, gamePhase, sequence])

  // Countdown timer during input phase - 15 seconds to answer
  useEffect(() => {
    if (gamePhase !== "input" || !isMyTurn || waitingForOpponent) return

    if (inputTimeLeft > 0) {
      const timer = setTimeout(() => setInputTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      // Time's up! Submit partial score
      const score = calculateScore(sequence, playerInput)
      setMyFinalScore(score)
      apiSubmitScore(score)
      setPlayerInput([])
      setWaitingForOpponent(true)
    }
  }, [gamePhase, isMyTurn, inputTimeLeft, waitingForOpponent, sequence, playerInput, apiSubmitScore])

  // Check for game over
  useEffect(() => {
    if (matchState.status === 'finished' && !waitingForOpponent) {
      setGamePhase("results")
    }
  }, [matchState.status, waitingForOpponent])
  const handleNumberClick = (num: number) => {
    if (gamePhase !== "input" || !isMyTurn) return

    const newInput = [...playerInput, num]
    setPlayerInput(newInput)

    // Check if correct
    if (sequence[newInput.length - 1] !== num) {
      // Wrong answer - calculate score based on how far they got
      const score = calculateScore(sequence, newInput)
      setMyFinalScore(score)

      // Send my score to API
      apiSubmitScore(score)

      setPlayerInput([])
      setWaitingForOpponent(true)
    } else if (newInput.length === sequence.length) {
      // Correct full sequence - perfect score
      const score = sequence.length
      setMyFinalScore(score)

      // Send my score to API
      apiSubmitScore(score)

      setPlayerInput([])
      setWaitingForOpponent(true)
    }
  }

  // Determine player roles: player1 is always 'me', player2 is opponent
  const isPlayer1 = matchState.player1 === account
  const player1Score = isPlayer1 ? matchState.player1Score : matchState.player2Score
  const player2Score = isPlayer1 ? matchState.player2Score : matchState.player1Score

  // Track scores from match state updates (from API polling)
  useEffect(() => {
    if (matchState.matchId === matchId) {
      // Update opponent's score when it comes from API
      const opponentScore = isPlayer1 ? matchState.player2Score : matchState.player1Score

      console.log('📊 Score tracking effect:', {
        isPlayer1,
        'matchState.player1Score': matchState.player1Score,
        'matchState.player2Score': matchState.player2Score,
        opponentScore,
        myFinalScore,
        opponentFinalScore,
        status: matchState.status,
        'opponentScore >= 0': opponentScore !== null && opponentScore >= 0,
        'opponentFinalScore === null': opponentFinalScore === null,
        'myFinalScore !== null': myFinalScore !== null
      })

      // Set opponent score if API has sent it and we haven't captured it yet
      if (opponentScore !== null && typeof opponentScore === 'number' && opponentScore >= 0 && opponentFinalScore === null) {
        console.log('✅ Setting opponent final score to:', opponentScore)
        setOpponentFinalScore(opponentScore)
      }

      // If both scores are set, determine winner but keep waiting phase for 5 seconds
      if (myFinalScore !== null && opponentFinalScore !== null && waitingForOpponent && !winnerSubmittedRef.current) {
        console.log('🏁 Both scores available, determining winner...', {
          myFinalScore,
          opponentFinalScore
        })

        // Determine winner - null for draw
        const isDraw = myFinalScore === opponentFinalScore
        const winner = isDraw ? null :
          myFinalScore > opponentFinalScore ? account : opponent

        console.log('📤 Calling submitWinner with winner:', winner, 'isDraw:', isDraw)
        if (!isDraw) {
          submitWinner(winner!)
        }
        winnerSubmittedRef.current = true
      }
    }
  }, [matchState.player1Score, matchState.player2Score, matchState.matchId, matchState.status, matchId, myFinalScore, opponentFinalScore, isPlayer1, account, opponent, submitWinner, waitingForOpponent])

  // 5-second countdown timer for waiting phase
  useEffect(() => {
    if (waitingForOpponent && myFinalScore !== null && opponentFinalScore !== null) {
      if (waitingTimer > 0) {
        const timer = setTimeout(() => {
          setWaitingTimer(prev => prev - 1)
        }, 1000)
        return () => clearTimeout(timer)
      } else {
        // Timer finished, show results
        setWaitingForOpponent(false)
        setGamePhase("results")
      }
    }
  }, [waitingForOpponent, waitingTimer, myFinalScore, opponentFinalScore])

  // Debug logging
  console.log('🎮 Game State Debug:', {
    matchId,
    'matchState.matchId': matchState.matchId,
    'matchState.status': matchState.status,
    account: account,
    'matchState.player1': matchState.player1,
    'matchState.player2': matchState.player2,
    isPlayer1: isPlayer1,
    myFinalScore: myFinalScore,
    opponentFinalScore: opponentFinalScore,
    'matchState.player1Score': matchState.player1Score,
    'matchState.player2Score': matchState.player2Score,
    player1Score: player1Score,
    player2Score: player2Score,
    waitingForOpponent: waitingForOpponent,
    gamePhase: gamePhase,
    apiError: apiError
  })

  if (apiError) {
    return (
      <div className="min-h-screen bg-background bg-cyber-grid py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center border-destructive/30">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold mb-4 text-destructive">Connection Error</h2>
            <p className="text-muted-foreground mb-6">{apiError}</p>
            <Button variant="neon-cyan" onClick={() => window.location.reload()}>Retry Connection</Button>
          </Card>
        </div>
      </div>
    )
  }

  if (gamePhase === "results") {
    const winnerAddress = matchState?.winner
    const isWinner = winnerAddress === account
    const isDraw = myFinalScore === opponentFinalScore

    // Calculate winnings: 75% of total pot (2x stake)
    const totalPot = parseFloat(stake) * 2
    const platformFee = totalPot * 0.25 // 25% platform fee
    const winnerPayout = totalPot * 0.75 // 75% to winner
    const formattedPayout = winnerPayout.toFixed(4)
    const formattedFee = platformFee.toFixed(4)

    return (
      <GameResultCard
        isWinner={isWinner}
        isDraw={isDraw}
        myScore={myFinalScore ?? 0}
        opponentScore={opponentFinalScore ?? 0}
        opponentName={formatAddress(opponent)}
        stake={stake}
        winnerPayout={formattedPayout}
        platformFee={formattedFee}
        matchId={matchId}
        matchStatus={matchState.status}
        withdrawn={withdrawn}
        withdrawing={withdrawing || isWithdrawing || isWithdrawingDraw}
        withdrawTxHash={withdrawTxHash}
        onWithdraw={handleWithdraw}
        onPlayAgain={() => window.location.reload()}
      />
    )
  }

  if (waitingForOpponent) {
    const bothScoresReady = myFinalScore !== null && opponentFinalScore !== null

    return (
      <div className="min-h-screen bg-background bg-cyber-grid py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center border-primary/20">
            {/* Countdown or Waiting */}
            {bothScoresReady ? (
              <>
                <div className="text-7xl font-bold text-primary text-glow-cyan mb-4 animate-pulse">
                  {waitingTimer}
                </div>
                <p className="text-muted-foreground">Calculating results...</p>
              </>
            ) : (
              <>
                <div className="relative mx-auto w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Waiting for Opponent...</h2>
                <p className="text-muted-foreground">Your score has been submitted</p>
              </>
            )}

            {/* Score Cards */}
            <div className="grid grid-cols-2 gap-4 my-8">
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Your Score</p>
                <p className="text-4xl font-bold text-primary text-glow-cyan">{myFinalScore ?? 0}</p>
              </div>
              <div className="p-4 rounded-lg border border-secondary/30 bg-secondary/5">
                <p className="text-xs text-muted-foreground mb-1 uppercase">Opponent</p>
                {opponentFinalScore !== null ? (
                  <p className="text-4xl font-bold text-secondary">{opponentFinalScore}</p>
                ) : (
                  <div className="flex justify-center gap-1">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background bg-cyber-grid py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto p-8 border-primary/20">
          {/* Game Title */}
          <h2 className="text-3xl font-bold text-center mb-2 text-foreground">
            🔢 <span className="text-gradient-cyber">Number Memory</span>
          </h2>
          <p className="text-sm text-center text-muted-foreground mb-6">Memorize and repeat the sequence</p>

          {/* Score Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">You</p>
              <p className="text-3xl font-bold text-primary text-glow-cyan">{myFinalScore ?? '—'}</p>
            </div>
            <div className="p-3 rounded-lg border border-secondary/30 bg-secondary/5 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Opponent</p>
              <p className="text-3xl font-bold text-secondary">{opponentFinalScore ?? '—'}</p>
            </div>
          </div>

          {/* Display Phase - Showing Numbers */}
          {gamePhase === "display" && (
            <div className="text-center mb-8">
              {/* Number Display Box */}
              <div className="relative flex items-center justify-center h-48 rounded-lg border-2 border-primary/40 bg-black/50 shadow-[0_0_30px_rgba(0,240,255,0.2)] mb-4">
                <p className="text-8xl font-bold text-primary text-glow-cyan animate-pulse">
                  {sequence[displayIndex]}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-3 mb-3">
                {sequence.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${index <= displayIndex
                      ? 'bg-primary shadow-[0_0_8px_rgba(0,240,255,0.6)]'
                      : 'bg-muted-foreground/30'
                      }`}
                  />
                ))}
              </div>
              <p className="text-sm text-primary">
                Memorize... ({displayIndex + 1}/{sequence.length})
              </p>
            </div>
          )}

          {/* Input Phase */}
          {gamePhase === "input" && isMyTurn && (
            <div className="text-center mb-8">
              {/* Countdown Timer */}
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${inputTimeLeft <= 5
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse'
                    : 'bg-accent/10 border-accent/30 text-accent'
                  }`}>
                  <span className="text-2xl font-bold">{inputTimeLeft}</span>
                  <span className="text-sm">seconds left</span>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-accent text-glow-green">Your Turn!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter the {sequence.length}-digit sequence ({playerInput.length}/{sequence.length})
              </p>

              {/* Full 0-9 Keypad - No hints! */}
              <div className="grid grid-cols-5 gap-3 max-w-sm mx-auto mb-6">
                {fullKeypad.map((num) => (
                  <Button
                    key={num}
                    onClick={() => handleNumberClick(num)}
                    variant="outline"
                    className="w-14 h-14 text-xl font-bold hover:border-primary hover:text-primary hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all active:scale-95"
                  >
                    {num}
                  </Button>
                ))}
              </div>

              {/* Current Input Display */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Your Sequence</p>
                <div className="flex justify-center gap-2 min-h-10">
                  {playerInput.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Click numbers above...</p>
                  ) : (
                    playerInput.map((num, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)] anim-fade-in-scale"
                      >
                        {num}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Waiting for opponent's turn */}
          {gamePhase === "input" && !isMyTurn && (
            <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-border bg-card/50 mb-8">
              <div className="flex gap-1 mb-4">
                <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-lg text-muted-foreground">Waiting for opponent...</p>
            </div>
          )}

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-3">
            <Badge variant={matchState.status === 'in_progress' ? 'neon-green' : 'neon-orange'} className="gap-2">
              <div className={`w-2 h-2 rounded-full ${matchState.status === 'in_progress' ? 'bg-accent animate-pulse' : 'bg-warning'}`} />
              {matchState.status === 'in_progress' ? 'Active' : 'Waiting'}
            </Badge>
            {isMyTurn && gamePhase === "input" && (
              <Badge variant="neon-cyan">Your Turn</Badge>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}