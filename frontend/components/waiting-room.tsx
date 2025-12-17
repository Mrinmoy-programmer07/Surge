"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
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
  onGameStart: (opponent: string, matchId: string) => void
}

export default function WaitingRoom({ gameType, stake, account, onGameStart }: WaitingRoomProps) {
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
  } = useWebSocketMatchmaking(gameType, stake)
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
        <Card className="w-full max-w-2xl p-8 border-border">
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
        <Card className="w-full max-w-2xl p-8 border-border">
          <h2 className="text-2xl font-bold mb-8 text-center text-red-500">Connection Error</h2>
          <p className="text-center text-muted-foreground mb-4">{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
          {isSearching && (
            <button className="mt-4 bg-gray-200 text-red-500 px-4 py-2 rounded" onClick={() => { leaveQueue(); router.refresh ? router.refresh() : window.location.reload(); }}>
              Leave Queue
            </button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl p-8 border-border">
        <h2 className="text-2xl font-bold mb-8 text-center text-foreground">
          {opponent
            ? "Match Found!"
            : isSearching
              ? "Searching for Opponent..."
              : "Connecting..."}
        </h2>

        {/* Connection Status */}
        <div className="text-center mb-4">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>

          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ml-2 ${gameConnected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${gameConnected ? 'bg-blue-500' : 'bg-gray-500'
              }`}></div>
            Game: {gameConnected ? 'Ready' : 'Waiting'}
          </div>

          {/* Match ID Display */}
          {wsMatchId && (
            <div className="mt-2 text-xs text-muted-foreground">
              Match ID: <span className="font-mono">{wsMatchId.slice(-8)}</span>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Player 1 */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <p className="font-mono text-sm text-primary mb-2">{formatAddress(address)}</p>
            <p className="text-xs text-muted-foreground">You</p>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-muted-foreground mb-2">VS</p>
              <p className="text-xs text-muted-foreground">Stake: {stake} SOL</p>
            </div>
          </div>

          {/* Player 2 */}
          <div className="text-center col-span-2 md:col-span-1">
            {opponent ? (
              <>
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="font-mono text-sm text-secondary mb-2">{formatAddress(opponent)}</p>
                <p className="text-xs text-muted-foreground">Opponent</p>
              </>
            ) : isSearching ? (
              <>
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-sm text-muted-foreground">Searching for opponent...</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏳</span>
                </div>
                <p className="text-sm text-muted-foreground">Waiting to connect...</p>
              </>
            )}
          </div>
        </div>

        {/* Countdown */}
        {opponent && (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Game starts in:</p>
            <p className="text-5xl font-bold text-primary">{countdown}</p>
          </div>
        )}

        {/* Leave Queue Button */}
        {!opponent && isSearching && (
          <button className="mt-6 w-full px-6 py-2 bg-gray-200 text-red-600 font-semibold rounded hover:bg-red-100 transition" onClick={() => { leaveQueue(); router.refresh ? router.refresh() : window.location.reload(); }}>
            Leave Queue
          </button>
        )}
      </Card>
    </div>
  )
}
