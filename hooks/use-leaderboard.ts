import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface LeaderboardEntry {
  playerId: string
  username: string
  wins: number
  totalEarnings: number
}

export interface Leaderboard {
  hourly: LeaderboardEntry[]
  daily: LeaderboardEntry[]
  weekly: LeaderboardEntry[]
  allTime: LeaderboardEntry[]
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<Leaderboard>({
    hourly: [],
    daily: [],
    weekly: [],
    allTime: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'leaderboard', 'rankings'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setLeaderboard({
            hourly: data.hourly ? Object.values(data.hourly) : [],
            daily: data.daily ? Object.values(data.daily) : [],
            weekly: data.weekly ? Object.values(data.weekly) : [],
            allTime: data.allTime ? Object.values(data.allTime) : []
          })
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const updateLeaderboard = async (timeframe: 'hourly' | 'daily' | 'weekly' | 'allTime', rankings: LeaderboardEntry[]) => {
    try {
      const leaderboardRef = doc(db, 'leaderboard', 'rankings')
      const leaderboardDoc = await getDoc(leaderboardRef)
      
      if (leaderboardDoc.exists()) {
        const currentData = leaderboardDoc.data()
        const updatedRankings = rankings.reduce((acc, entry, index) => {
          acc[index + 1] = entry
          return acc
        }, {} as Record<string, LeaderboardEntry>)
        
        await updateDoc(leaderboardRef, {
          [timeframe]: updatedRankings
        })
      } else {
        // Create new leaderboard document
        const newRankings = rankings.reduce((acc, entry, index) => {
          acc[index + 1] = entry
          return acc
        }, {} as Record<string, LeaderboardEntry>)
        
        await updateDoc(leaderboardRef, {
          [timeframe]: newRankings
        })
      }
    } catch (error) {
      console.error('Error updating leaderboard:', error)
      throw error
    }
  }

  return { leaderboard, loading, updateLeaderboard }
}

export function usePlatformStats() {
  const [stats, setStats] = useState({
    dailyActiveUsers: 0,
    totalGamesPlayed: 0,
    totalRevenue: 0,
    timestamp: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'platformStats', 'current'),
      (doc) => {
        if (doc.exists()) {
          setStats(doc.data() as typeof stats)
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const updateStats = async (updates: Partial<typeof stats>) => {
    try {
      await updateDoc(doc(db, 'platformStats', 'current'), {
        ...updates,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error updating platform stats:', error)
      throw error
    }
  }

  return { stats, loading, updateStats }
}
