"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameState } from "@/lib/game-state-context"
import { useMatchApi } from "@/hooks/use-match-api"
import { useSurgeContract, useMatchData } from "@/hooks/use-surge-contract"
import { formatAddress } from "@/lib/game-utils"

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
  } = useMatchApi(matchId, account)
  
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
    initializeMatch(account, opponent, { rounds: 5 })
  }, [matchId, account, opponent, initializeMatch])

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

  // Track opponent's FINAL score from matchState (only after all rounds complete)
  useEffect(() => {
    // Only update opponent score when in results phase
    if (gamePhase === "results") {
      const isPlayer1 = matchState.player1 === account
      const opponentFinalScore = isPlayer1 ? matchState.player2Score : matchState.player1Score
      
      if (opponentFinalScore !== null && typeof opponentFinalScore === 'number' && opponentFinalScore >= 0) {
        console.log('✅ Received opponent final score from matchState:', opponentFinalScore)
        setOpponentScore(opponentFinalScore)
      }
    }
  }, [matchState.player1Score, matchState.player2Score, matchState.player1, account, gamePhase])

  // Handle each round's opponent turn (no real opponent data, just local timing)
  useEffect(() => {
    if (gamePhase !== "opponent-turn") return

    const timer = setTimeout(() => {
      // Just give player a point for completing the round
      // Don't simulate opponent - we'll compare final scores at the end
      setPlayerScore((prev) => prev + 1)

      setRoundsPlayed((prev) => prev + 1)

      if (roundsPlayed + 1 >= 5) {
        // All rounds complete - move to results
        setGamePhase("results")
      } else {
        // Next round
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
      // Submit player's final score when all rounds complete
      if (!winnerSubmittedRef.current) {
        winnerSubmittedRef.current = true
        
        const submitPlayerScore = async () => {
          try {
            console.log('📤 Submitting player final score:', playerScore)
            await apiSubmitScore(playerScore)
            console.log('✅ Player final score submitted successfully')
          } catch (error) {
            console.error('❌ Failed to submit player score:', error)
          }
        }
        
        submitPlayerScore()
      }
      
      // Wait for opponent's score from matchState before declaring winner
      // The matchState tracking useEffect will update opponentScore automatically
    }
  }, [gamePhase, playerScore, apiSubmitScore])

  // Finalize game when both scores are available
  useEffect(() => {
    if (gamePhase === "results" && opponentScore > 0) {
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
            
            {!withdrawn && !withdrawTxHash && (
              <>
                {!blockchainMatchReady && (
                  <div className="mb-6">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">Waiting for blockchain confirmation...</p>
                  </div>
                )}
                
                <p className="text-muted-foreground mb-8">
                  {winner === "You"
                    ? `You won! Claim ${(parseFloat(stake) * 2 * 0.75).toFixed(2)} CELO (75% of ${(parseFloat(stake) * 2).toFixed(2)} CELO pot)`
                    : winner === "Draw"
                      ? `Match ended in a tie! Both players get their ${stake} CELO stake back`
                      : `You lost this round`}
                </p>
                
                <div className="flex gap-4 justify-center">
                  {winner === "You" && (
                    <Button
                      onClick={() => handleWithdraw(false)} 
                      disabled={!blockchainMatchReady || isWithdrawing || withdrawing}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                      {isWithdrawing || withdrawing ? "Processing..." : blockchainMatchReady ? "💰 Withdraw Winnings" : "⏳ Preparing..."}
                    </Button>
                  )}
                  
                  {winner === "Draw" && (
                    <Button
                      onClick={() => handleWithdraw(true)} 
                      disabled={!blockchainMatchReady || isWithdrawingDraw || withdrawing}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    >
                      {isWithdrawingDraw || withdrawing ? "Processing..." : blockchainMatchReady ? "↩️ Claim Stake Back" : "⏳ Preparing..."}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = "/")}
                    className="border-border hover:bg-card"
                  >
                    Back to Lobby
                  </Button>
                </div>
              </>
            )}
            
            {(withdrawing || isWithdrawing || isWithdrawingDraw) && !withdrawn && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Confirming withdrawal on blockchain...</p>
              </div>
            )}
            
            {withdrawn && withdrawTxHash && (
              <div className="text-center py-4">
                <p className="text-green-600 font-bold mb-4">✅ Withdrawal Successful!</p>
                <a 
                  href={`https://celo-sepolia.blockscout.com/tx/${withdrawTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View transaction on Blockscout →
                </a>
                <div className="mt-6">
                  <Button
                    onClick={() => (window.location.href = "/")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
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
