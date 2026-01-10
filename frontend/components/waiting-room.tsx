"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { GameType } from "@/lib/game-types"
import { formatAddress } from "@/lib/game-utils"
import { useWebSocketMatchmaking } from "@/hooks/use-websocket-matchmaking"
import { useMultiplayerGame } from "@/hooks/use-multiplayer-game"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

interface WaitingRoomProps {
  gameType: GameType
  stake: string
  account: string
  matchId: string
  onGameStart: (opponent: string, matchId: string) => void
}

export default function WaitingRoom({ gameType, stake, account, matchId, onGameStart }: WaitingRoomProps) {
  const [countdown, setCountdown] = useState(3)
  const gameStartedRef = useRef(false)
  const { toast } = useToast()
  const router = useRouter();
  const {
    opponent,
    matchId: wsMatchId,
    gameStartTime,
    isSearching,
    isConnected,
    error,
    address,
    isMatchCreator,
    leaveQueue
  } = useWebSocketMatchmaking(gameType, stake, matchId)
  const {
    gameState,
    isConnected: gameConnected,
    markReady
  } = useMultiplayerGame()

  // Mark ready when match is found and game server is connected
  useEffect(() => {
    if (!wsMatchId || !gameConnected || !address || !opponent) return
    markReady(wsMatchId)
  }, [wsMatchId, gameConnected, address, opponent, markReady])

  // Synchronized countdown based on server time
  useEffect(() => {
    if (!gameStartTime || !wsMatchId || !opponent) return

    const updateCountdown = () => {
      const now = Date.now()
      const timeLeft = Math.max(0, Math.ceil((gameStartTime - now) / 1000))
      setCountdown(timeLeft)

      if (timeLeft <= 0 && !gameStartedRef.current) {
        gameStartedRef.current = true
        console.log('⏰ Countdown finished, starting game with opponent:', opponent)
        onGameStart(opponent, wsMatchId)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 100)
    return () => clearInterval(interval)
  }, [gameStartTime, opponent, wsMatchId, onGameStart])

  // Reset countdown when opponent changes
  useEffect(() => {
    if (opponent) {
      setCountdown(3)
      gameStartedRef.current = false
    }
  }, [opponent])

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl p-8 border-primary/20 bg-card/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-8 text-center text-foreground">Connect Your Wallet</h2>
          <p className="text-center text-muted-foreground">
            Please connect your wallet to start matchmaking
          </p>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-2xl p-8 border-destructive/30 bg-card/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-8 text-center text-destructive">Connection Error</h2>
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            {isSearching && (
              <Button
                variant="destructive"
                onClick={() => { leaveQueue(); router.refresh ? router.refresh() : window.location.reload(); }}
              >
                Leave Queue
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl p-8 border-primary/20 bg-card/80 backdrop-blur-sm">
        {/* Title with animated glow */}
        <h2 className={`text-2xl font-bold mb-8 text-center ${opponent
            ? "text-accent text-glow-green"
            : isSearching
              ? "text-primary text-glow-cyan animate-pulse"
              : "text-foreground"
          }`}>
          {opponent
            ? "⚔️ Match Found!"
            : isSearching
              ? "🔍 Searching for Opponent..."
              : "🔌 Connecting..."}
        </h2>

        {/* Connection Status Badges */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Badge
            variant={isConnected ? "neon-green" : "neon-orange"}
            className="gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent animate-pulse' : 'bg-warning'
              }`} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </Badge>

          <Badge
            variant={gameConnected ? "neon-cyan" : "outline"}
            className="gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${gameConnected ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
              }`} />
            Game: {gameConnected ? 'Ready' : 'Waiting'}
          </Badge>

          {/* Match ID Display */}
          {wsMatchId && (
            <Badge variant="outline" className="font-mono text-xs">
              Match: {wsMatchId.slice(-8)}
            </Badge>
          )}
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Player 1 (You) */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300">
              <span className="text-3xl">👤</span>
            </div>
            <p className="font-mono text-sm text-primary mb-1">{formatAddress(address)}</p>
            <Badge variant="neon-cyan" className="text-xs">You</Badge>
            <p className="text-xs text-accent mt-2">✓ Stake Paid</p>
          </div>

          {/* VS Display */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${opponent
                  ? "text-gradient-cyber"
                  : "text-muted-foreground"
                }`}>
                VS
              </div>
              <div className="px-3 py-1 bg-warning/10 border border-warning/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Stake</p>
                <p className="text-sm font-bold text-warning">{stake} ETH</p>
              </div>
            </div>
          </div>

          {/* Player 2 (Opponent) */}
          <div className="text-center">
            {opponent ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/20 border-2 border-secondary/50 flex items-center justify-center shadow-[0_0_20px_rgba(255,0,128,0.3)] transition-all duration-300 anim-fade-in-scale">
                  <span className="text-3xl">👤</span>
                </div>
                <p className="font-mono text-sm text-secondary mb-1">{formatAddress(opponent)}</p>
                <Badge variant="neon-pink" className="text-xs">Opponent</Badge>
              </>
            ) : isSearching ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center animate-pulse relative">
                  <span className="text-3xl">🔍</span>
                  {/* Animated search rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping" />
                </div>
                <p className="text-sm text-muted-foreground">Searching...</p>
                <div className="flex justify-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/20 border-2 border-border flex items-center justify-center">
                  <span className="text-3xl opacity-50">⏳</span>
                </div>
                <p className="text-sm text-muted-foreground">Waiting...</p>
              </>
            )}
          </div>
        </div>

        {/* Countdown */}
        {opponent && (
          <div className="text-center py-6 border-t border-primary/20">
            <p className="text-muted-foreground mb-4">Game starts in:</p>
            <div className="relative inline-block">
              <p className="text-7xl font-bold text-primary text-glow-cyan anim-countdown-pop" key={countdown}>
                {countdown}
              </p>
              {/* Glow ring */}
              <div className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
          </div>
        )}

        {/* Leave Queue Button */}
        {!opponent && isSearching && (
          <div className="mt-6 pt-6 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
              onClick={() => { leaveQueue(); router.refresh ? router.refresh() : window.location.reload(); }}
            >
              Leave Queue
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

