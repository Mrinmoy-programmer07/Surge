"use client"

import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useMatchmakingQueue, useGames, usePlayers } from '@/hooks/use-firebase'
import { MatchmakingService } from '@/lib/matchmaking-service'

export function useWalletMatchmaking(gameType: string, stake: string) {
  const [opponent, setOpponent] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(3)
  const [queueId, setQueueId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const gameStartedRef = useRef(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  
  const { address, isConnected } = useAccount()
  const { queue, joinQueue, leaveQueue } = useMatchmakingQueue()
  const { createGame } = useGames()
  const { addPlayer, getPlayerByWallet } = usePlayers()

  // Start matchmaking polling
  const startMatchmakingPolling = () => {
    console.log('🔄 Starting matchmaking polling...')
    setIsSearching(true)
    
    pollingRef.current = setInterval(async () => {
      if (!address || opponent) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
        return
      }

      try {
        console.log('🔍 Polling for matches...')
        const match = await MatchmakingService.findMatch(
          address,
          gameType,
          parseFloat(stake)
        )
        
        if (match) {
          console.log('🎉 Match found!', match)
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
          setIsSearching(false)
          setOpponent(match)
        }
      } catch (error) {
        console.error('Error polling for matches:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Stop polling after 30 seconds
    setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
        setIsSearching(false)
        console.log('⏰ Matchmaking timeout - no match found')
      }
    }, 30000)
  }

  // Join matchmaking
  const joinMatchmaking = async () => {
    if (!isConnected || !address) {
      console.error('❌ Wallet not connected')
      return
    }

    try {
      console.log('🚀 Starting matchmaking process...')
      
      // First, ensure player exists in database
      const existingPlayer = await getPlayerByWallet(address)
      if (!existingPlayer) {
        // Create player record automatically
        await addPlayer({
          username: `Player_${address.slice(0, 6)}`, // Generate username from address
          walletAddress: address,
          wins: 0,
          losses: 0,
          totalEarnings: 0,
          createdAt: Date.now(),
          lastActive: Date.now()
        })
        console.log('✅ Player created:', address)
      }
      
      // Try to find existing match immediately
      const existingMatch = await MatchmakingService.findMatch(
        address, 
        gameType, 
        parseFloat(stake)
      )
      
      if (existingMatch) {
        console.log('⚡ Found immediate match!', existingMatch)
        setOpponent(existingMatch)
        setIsSearching(false)
        return
      }
      
      // Join queue
      const id = await joinQueue({
        playerAddress: address,
        gameType: gameType,
        stake: parseFloat(stake),
        status: 'waiting'
      })
      setQueueId(id)
      console.log('✅ Joined queue with ID:', id)
      
      // Start polling for matches
      startMatchmakingPolling()
      
    } catch (error) {
      console.error('Error joining matchmaking queue:', error)
    }
  }

  // Leave matchmaking
  const leaveMatchmaking = async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (queueId) {
      await leaveQueue(queueId)
    }
    setIsSearching(false)
    setOpponent(null)
    setQueueId(null)
  }

  // Start game when opponent found
  const startGame = async (onGameStart: (opponent: string) => void) => {
    if (countdown <= 0 && opponent && !gameStartedRef.current) {
      gameStartedRef.current = true
      
      // Create game in Firebase
      try {
        await createGame({
          player1Id: address!,
          player2Id: opponent,
          gameType: gameType,
          startTime: Date.now(),
          stakes: {
            player1Stake: parseFloat(stake),
            player2Stake: parseFloat(stake)
          },
          status: 'in_progress'
        })
      } catch (error) {
        console.error('Error creating game record:', error)
      }

      onGameStart(opponent)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      if (queueId) {
        leaveQueue(queueId)
      }
    }
  }, [queueId, leaveQueue])

  return {
    opponent,
    countdown,
    setCountdown,
    isSearching,
    queueId,
    joinMatchmaking,
    leaveMatchmaking,
    startGame,
    isConnected,
    address
  }
}
