"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useGameState } from "@/lib/game-state-context"
import { useMatchApi } from "@/hooks/use-match-api"
import { useSurgeContract, useMatchData } from "@/hooks/use-surge-contract"
import { formatAddress } from "@/lib/game-utils"

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
  
  // Query blockchain match data to verify status before withdrawal
  const { data: blockchainMatch, refetch: refetchMatch } = useMatchData(matchId)
  
  // Poll blockchain match status when in results phase
  useEffect(() => {
    if (gamePhase === "results" && !blockchainMatchReady) {
      console.log('🔍 Checking blockchain match status...')
      
      const checkInterval = setInterval(async () => {
        const result = await refetchMatch()
        const match = result.data as any
        
        if (match) {
          console.log('📊 Blockchain match status:', match.status, 'Completed=2, Draw=4')
          
          // MatchStatus: 0=Pending, 1=Active, 2=Completed, 3=Cancelled, 4=Draw
          if (match.status === 2 || match.status === 4) {
            console.log('✅ Match ready for withdrawal on blockchain!')
            setBlockchainMatchReady(true)
            clearInterval(checkInterval)
          }
        }
      }, 2000) // Check every 2 seconds
      
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
    initializeMatch(account, opponent, { cardPairs: CARD_PAIRS })
  }, [matchId, account, opponent, initializeMatch])

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
            
            {!withdrawn && !withdrawTxHash && (
              <>
                {!blockchainMatchReady && (
                  <div className="mb-6">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">
                      Waiting for blockchain confirmation...
                    </p>
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
