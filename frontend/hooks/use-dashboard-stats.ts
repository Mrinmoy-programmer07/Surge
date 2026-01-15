"use client"

import { useState, useEffect, useMemo } from "react"
import { db, isFirebaseAvailable } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore"
import type { Player, MatchHistory } from "./use-firebase"

export interface DashboardStats {
  totalWinnings: number
  winRate: number
  currentStreak: number
  gamesPlayed: number
  wins: number
  losses: number
  recentGames: RecentGame[]
  weeklyStats: WeeklyStats[]
  gameTypeStats: GameTypeStats[]
}

export interface RecentGame {
  id: string
  opponent: string
  game: string
  result: "Won" | "Lost" | "Draw"
  amount: string
  time: string
}

export interface WeeklyStats {
  name: string
  wins: number
  losses: number
}

export interface GameTypeStats {
  name: string
  value: number
  color: string
}

const GAME_TYPE_COLORS: Record<string, string> = {
  "number-memory": "#00f0ff",
  "word-scramble": "#ff0080",
  "pattern": "#ff6b00",
  "reflex": "#39ff14",
  "memory-match": "#ffd700",
}

const GAME_TYPE_NAMES: Record<string, string> = {
  "number-memory": "Number Memory",
  "word-scramble": "Word Scramble",
  "pattern": "Pattern Predictor",
  "reflex": "Reflex War",
  "memory-match": "Memory Match",
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (minutes > 0) return `${minutes} min${minutes > 1 ? "s" : ""} ago`
  return "Just now"
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function useDashboardStats(walletAddress: string | undefined) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch player data
  useEffect(() => {
    if (!walletAddress || !isFirebaseAvailable()) {
      setLoading(false)
      return
    }

    const fetchPlayer = async () => {
      try {
        const playerDoc = await getDoc(doc(db, "players", walletAddress))
        if (playerDoc.exists()) {
          setPlayer({ id: playerDoc.id, ...playerDoc.data() } as Player)
        }
      } catch (err) {
        console.error("Error fetching player:", err)
        setError("Failed to load player data")
      }
    }

    fetchPlayer()
  }, [walletAddress])

  // Fetch match history for this player (real-time)
  useEffect(() => {
    if (!walletAddress || !isFirebaseAvailable()) {
      setLoading(false)
      return
    }

    // Query matches where user is player1 or player2
    const matchesQuery = query(
      collection(db, "matchHistory"),
      orderBy("timestamp", "desc"),
      limit(50)
    )

    const unsubscribe = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as MatchHistory))
        .filter(
          (match) =>
            match.player1Id === walletAddress || match.player2Id === walletAddress
        )
      setMatchHistory(matches)
      setLoading(false)
    }, (err) => {
      console.error("Error fetching match history:", err)
      setError("Failed to load match history")
      setLoading(false)
    })

    return () => unsubscribe()
  }, [walletAddress])

  // Compute dashboard stats
  const stats = useMemo<DashboardStats>(() => {
    const wins = player?.wins || 0
    const losses = player?.losses || 0
    const totalGames = wins + losses
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
    const totalWinnings = player?.totalEarnings || 0

    // Calculate current streak from match history
    let currentStreak = 0
    for (const match of matchHistory) {
      const isPlayer1 = match.player1Id === walletAddress
      const outcome = isPlayer1
        ? match.player1Perspective?.outcome
        : match.player2Perspective?.outcome
      
      if (outcome === "win") {
        currentStreak++
      } else {
        break
      }
    }

    // Format recent games
    const recentGames: RecentGame[] = matchHistory.slice(0, 5).map((match) => {
      const isPlayer1 = match.player1Id === walletAddress
      const opponent = isPlayer1 ? match.player2Id : match.player1Id
      const perspective = isPlayer1 ? match.player1Perspective : match.player2Perspective
      const stake = isPlayer1 ? match.stakes?.player1Stake || 0 : match.stakes?.player2Stake || 0
      
      let result: "Won" | "Lost" | "Draw" = "Draw"
      let amountPrefix = ""
      if (perspective?.outcome === "win") {
        result = "Won"
        amountPrefix = "+"
      } else if (perspective?.outcome === "loss") {
        result = "Lost"
        amountPrefix = "-"
      }

      return {
        id: match.id || "",
        opponent: shortenAddress(opponent),
        game: GAME_TYPE_NAMES[match.gameType] || match.gameType,
        result,
        amount: `${amountPrefix}${stake.toFixed(4)} MNT`,
        time: formatTimeAgo(match.timestamp),
      }
    })

    // Calculate weekly stats (last 7 days)
    const now = Date.now()
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const weeklyStats: WeeklyStats[] = []
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i + 1) * 86400000
      const dayEnd = now - i * 86400000
      const dayMatches = matchHistory.filter(
        (m) => m.timestamp >= dayStart && m.timestamp < dayEnd
      )
      
      let dayWins = 0
      let dayLosses = 0
      dayMatches.forEach((match) => {
        const isPlayer1 = match.player1Id === walletAddress
        const outcome = isPlayer1
          ? match.player1Perspective?.outcome
          : match.player2Perspective?.outcome
        if (outcome === "win") dayWins++
        else if (outcome === "loss") dayLosses++
      })

      const dayDate = new Date(dayEnd)
      weeklyStats.push({
        name: dayNames[dayDate.getDay()],
        wins: dayWins,
        losses: dayLosses,
      })
    }

    // Calculate game type stats
    const gameTypeCounts: Record<string, number> = {}
    matchHistory.forEach((match) => {
      const type = match.gameType
      gameTypeCounts[type] = (gameTypeCounts[type] || 0) + 1
    })

    const gameTypeStats: GameTypeStats[] = Object.entries(gameTypeCounts).map(
      ([type, count]) => ({
        name: GAME_TYPE_NAMES[type] || type,
        value: count,
        color: GAME_TYPE_COLORS[type] || "#888888",
      })
    )

    return {
      totalWinnings,
      winRate,
      currentStreak,
      gamesPlayed: totalGames,
      wins,
      losses,
      recentGames,
      weeklyStats,
      gameTypeStats,
    }
  }, [player, matchHistory, walletAddress])

  return { stats, loading, error, player }
}
