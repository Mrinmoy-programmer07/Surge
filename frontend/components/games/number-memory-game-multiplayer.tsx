"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateNumberSequence, calculateScore } from "@/lib/game-utils"
import { useMatchApi } from "@/hooks/use-match-api"
import { formatAddress } from "@/lib/game-utils"
import { useSurgeContract } from "@/hooks/use-surge-contract"

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
  const [myFinalScore, setMyFinalScore] = useState<number | null>(null)
  const [opponentFinalScore, setOpponentFinalScore] = useState<number | null>(null)
  const [scrambledInputs, setScrambledInputs] = useState<number[]>([])
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [waitingTimer, setWaitingTimer] = useState<number>(5)
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
  } = useMatchApi(matchId, account)

  // Function to scramble the sequence for input buttons
  const scrambleSequence = (seq: number[]): number[] => {
    const scrambled = [...seq]
    for (let i = scrambled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]]
    }
    return scrambled
  }

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

  // Initialize match on mount
  useEffect(() => {
    const newSequence = generateNumberSequence(5)
    setSequence(newSequence)
    setScrambledInputs(scrambleSequence(newSequence))
    
    // Initialize match in API
    initializeMatch(account, opponent, { sequence: newSequence })
  }, [matchId, account, opponent, initializeMatch])

  // Turn management - both players can play simultaneously
  useEffect(() => {
    if (matchState.status === 'in_progress') {
      setIsMyTurn(true)
    }
  }, [matchState.status])

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
      setTimeout(() => {
        setGamePhase("input")
        setDisplayIndex(0)
        setIsMyTurn(true)
      }, 500) // Small delay before input phase
    }
  }, [displayIndex, gamePhase, sequence])

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
        
        // Determine winner and submit to API only once
        const winner = myFinalScore > opponentFinalScore ? account : 
                       opponentFinalScore > myFinalScore ? opponent : 
                       account // draw - default to account
        
        console.log('📤 Calling submitWinner with winner:', winner)
        submitWinner(winner)
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
      <div className="min-h-screen bg-linear-to-br from-background via-card to-background py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Connection Error</h2>
            <p className="text-muted-foreground mb-4">{apiError}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        </div>
      </div>
    )
  }

  if (gamePhase === "results") {
    const winnerAddress = matchState?.winner
    const isWinner = winnerAddress === account
    const isDraw = myFinalScore === opponentFinalScore
    const winnerText = isDraw ? "It's a Draw!" : isWinner ? "You Win! 🎉" : "Opponent Wins!"
    
    // Calculate winnings: 75% of total pot (2x stake)
    const totalPot = parseFloat(stake) * 2
    const platformFee = totalPot * 0.25 // 25% platform fee
    const winnerPayout = totalPot * 0.75 // 75% to winner
    const formattedPayout = winnerPayout.toFixed(4)
    const formattedFee = platformFee.toFixed(4)

    return (
      <div className="min-h-screen bg-linear-to-br from-background via-card to-background py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-4xl font-bold mb-4 text-center text-foreground">{winnerText}</h2>
            <p className="text-xl text-center text-muted-foreground mb-4">
              Final Score
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">You (Player 1)</p>
                <p className="text-3xl font-bold text-primary">{myFinalScore ?? 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Opponent (Player 2)</p>
                <p className="text-3xl font-bold text-secondary">{opponentFinalScore ?? 0}</p>
              </div>
            </div>
            
            {/* Winnings Display */}
            {isWinner && !isDraw && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg border-2 border-green-500">
                <p className="text-lg font-semibold text-green-800 dark:text-green-400 mb-3">
                  💰 You Won {formattedPayout} CELO!
                </p>
                <div className="text-sm text-green-700 dark:text-green-500 space-y-1">
                  <p>Total Pot: {stake} + {stake} = {totalPot.toFixed(4)} CELO</p>
                  <p>Platform Fee (25%): {formattedFee} CELO</p>
                  <p className="font-bold text-base">Your Payout (75%): {formattedPayout} CELO</p>
                </div>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground mb-8">
              <p>Match ID: {matchId}</p>
              <p>Game Status: {matchState.status}</p>
              {withdrawTxHash && (
                <p className="text-green-600 dark:text-green-400 mt-2">
                  Withdrawal Tx: {withdrawTxHash.substring(0, 10)}...{withdrawTxHash.substring(withdrawTxHash.length - 8)}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-3 items-center">
              {/* Withdraw Button - For winner */}
              {isWinner && !isDraw && !withdrawn && (
                <Button 
                  onClick={() => handleWithdraw(false)} 
                  disabled={withdrawing || isWithdrawing}
                  className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white"
                >
                  {(withdrawing || isWithdrawing) ? 'Confirming Transaction...' : `Withdraw ${formattedPayout} CELO`}
                </Button>
              )}
              
              {/* Withdraw Button - For draw (both players can withdraw) */}
              {isDraw && !withdrawn && (
                <Button 
                  onClick={() => handleWithdraw(true)} 
                  disabled={withdrawing || isWithdrawingDraw}
                  className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {(withdrawing || isWithdrawingDraw) ? 'Confirming Transaction...' : `Withdraw Stake (${stake} CELO)`}
                </Button>
              )}
              
              {/* Already Withdrawn Message */}
              {withdrawn && (
                <div className="text-green-600 dark:text-green-400 font-semibold">
                  ✅ Successfully Withdrawn {isDraw ? stake : formattedPayout} CELO!
                  {withdrawTxHash && (
                    <div className="text-xs mt-1">
                      <a 
                        href={`https://sepolia.celoscan.io/tx/${withdrawTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        View Transaction
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              {/* Play Again Button */}
              <Button 
                onClick={() => window.location.reload()} 
                className="px-8 py-4 text-lg"
                variant="outline"
              >
                Play Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (waitingForOpponent) {
    const bothScoresReady = myFinalScore !== null && opponentFinalScore !== null
    
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-card to-background py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {bothScoresReady ? `Results in ${waitingTimer}s...` : "Waiting for Opponent..."}
            </h2>
            <p className="text-muted-foreground mb-6">
              {bothScoresReady ? "Both scores received!" : "Your score has been submitted."}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Your Score (Player 1)</p>
                <p className="text-3xl font-bold text-primary">{myFinalScore ?? 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Opponent Score (Player 2)</p>
                {opponentFinalScore !== null ? (
                  <p className="text-3xl font-bold text-secondary">{opponentFinalScore}</p>
                ) : (
                  <div className="text-3xl font-bold text-muted-foreground animate-pulse">...</div>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {bothScoresReady 
                ? `Calculating winner...` 
                : "Waiting for opponent to finish their turn..."}
            </p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background py-8">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Number Memory</h2>

          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div>
              <p className="text-lg text-muted-foreground">Player 1 (You)</p>
              <p className="text-4xl font-bold text-primary">{myFinalScore ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Your Score</p>
            </div>
            <div>
              <p className="text-lg text-muted-foreground">Player 2 (Opponent)</p>
              <p className="text-4xl font-bold text-secondary">{opponentFinalScore ?? '—'}</p>
              <p className="text-xs text-muted-foreground">Opponent Score</p>
            </div>
          </div>

          {gamePhase === "display" && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                <p className="text-6xl font-bold text-foreground animate-fade-in">
                  {sequence[displayIndex]}
                </p>
              </div>
              {/* Progress indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {sequence.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= displayIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Memorize the numbers... ({displayIndex + 1}/{sequence.length})
              </p>
            </div>
          )}

          {gamePhase === "input" && isMyTurn && (
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-4">Your turn!</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Click the numbers in the correct order from memory
              </p>
              
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
                <div className="flex justify-center gap-2 min-h-8">
                  {playerInput.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No numbers entered yet</p>
                  ) : (
                    playerInput.map((num, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-bold"
                      >
                        {num}
                      </div>
                    ))
                  )}
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
              matchState.status === 'in_progress' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                matchState.status === 'in_progress' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              {matchState.status === 'in_progress' ? 'Active' : 'Waiting'}
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