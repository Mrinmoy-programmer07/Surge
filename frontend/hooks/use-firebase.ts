import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db, isFirebaseAvailable } from '@/lib/firebase'

// Types based on your database structure
export interface Player {
  id?: string
  username: string
  walletAddress: string
  wins: number
  losses: number
  totalEarnings: number
  createdAt: number
  lastActive: number
}

export interface Game {
  id?: string
  player1Id: string
  player2Id: string
  gameType: string
  startTime: number
  endTime?: number
  winnerId?: string
  stakes: {
    player1Stake: number
    player2Stake: number
  }
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
}

export interface MatchmakingQueue {
  id?: string
  playerAddress: string
  gameType: string
  stake: number
  timestamp: number
  status: 'waiting' | 'matched' | 'cancelled'
}

export interface Challenge {
  id?: string
  creatorId: string
  gameType: string
  stake: number
  status: 'open' | 'accepted' | 'completed' | 'expired'
  createdAt: number
  expiresAt: number
}

export interface MatchHistory {
  id?: string
  gameId: string
  player1Id: string
  player2Id: string
  winnerId: string
  gameType: string
  stakes: {
    player1Stake: number
    player2Stake: number
  }
  timestamp: number
  player1Perspective: {
    outcome: 'win' | 'loss' | 'draw'
    score: number
  }
  player2Perspective: {
    outcome: 'win' | 'loss' | 'draw'
    score: number
  }
}

export interface Notification {
  id?: string
  userId: string
  message: string
  timestamp: number
  isRead: boolean
}

// Custom hooks for different collections
export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available - usePlayers hook disabled')
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      collection(db, 'players'),
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Player[]
        setPlayers(playersData)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addPlayer = async (player: Omit<Player, 'id'>) => {
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available - cannot add player')
      throw new Error('Firebase not available')
    }
    
    try {
      // Use wallet address as the document ID for easier lookup
      const playerRef = doc(db, 'players', player.walletAddress)
      await setDoc(playerRef, {
        ...player,
        createdAt: Date.now(),
        lastActive: Date.now()
      })
      return player.walletAddress // Return wallet address as ID
    } catch (error) {
      console.error('Error adding player:', error)
      throw error
    }
  }

  const updatePlayer = async (playerId: string, updates: Partial<Player>) => {
    try {
      await updateDoc(doc(db, 'players', playerId), {
        ...updates,
        lastActive: Date.now()
      })
    } catch (error) {
      console.error('Error updating player:', error)
      throw error
    }
  }

  const getPlayerByWallet = async (walletAddress: string) => {
    if (!isFirebaseAvailable()) {
      return null
    }
    
    try {
      const playerDoc = await getDoc(doc(db, 'players', walletAddress))
      if (playerDoc.exists()) {
        return { id: playerDoc.id, ...playerDoc.data() } as Player
      }
      return null
    } catch (error) {
      console.error('Error getting player by wallet:', error)
      throw error
    }
  }

  return { players, loading, addPlayer, updatePlayer, getPlayerByWallet }
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'games'),
      (snapshot) => {
        const gamesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Game[]
        setGames(gamesData)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const createGame = async (game: Omit<Game, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'games'), {
        ...game,
        startTime: Date.now()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating game:', error)
      throw error
    }
  }

  const updateGame = async (gameId: string, updates: Partial<Game>) => {
    try {
      await updateDoc(doc(db, 'games', gameId), updates)
    } catch (error) {
      console.error('Error updating game:', error)
      throw error
    }
  }

  return { games, loading, createGame, updateGame }
}

export function useMatchmakingQueue() {
  const [queue, setQueue] = useState<MatchmakingQueue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'matchmakingQueue'), orderBy('timestamp', 'asc')),
      (snapshot) => {
        const queueData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MatchmakingQueue[]
        setQueue(queueData)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const joinQueue = async (queueEntry: Omit<MatchmakingQueue, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'matchmakingQueue'), {
        ...queueEntry,
        timestamp: Date.now()
      })
      return docRef.id
    } catch (error) {
      console.error('Error joining queue:', error)
      throw error
    }
  }

  const leaveQueue = async (queueId: string) => {
    try {
      await deleteDoc(doc(db, 'matchmakingQueue', queueId))
    } catch (error) {
      console.error('Error leaving queue:', error)
      throw error
    }
  }

  return { queue, loading, joinQueue, leaveQueue }
}

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'challenges'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const challengesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Challenge[]
        setChallenges(challengesData)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const createChallenge = async (challenge: Omit<Challenge, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'challenges'), {
        ...challenge,
        createdAt: Date.now()
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating challenge:', error)
      throw error
    }
  }

  const acceptChallenge = async (challengeId: string) => {
    try {
      await updateDoc(doc(db, 'challenges', challengeId), {
        status: 'accepted'
      })
    } catch (error) {
      console.error('Error accepting challenge:', error)
      throw error
    }
  }

  return { challenges, loading, createChallenge, acceptChallenge }
}

export function useMatchHistory() {
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'matchHistory'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const historyData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MatchHistory[]
        setMatchHistory(historyData)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addMatchToHistory = async (match: Omit<MatchHistory, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'matchHistory'), {
        ...match,
        timestamp: Date.now()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding match to history:', error)
      throw error
    }
  }

  const getPlayerMatchHistory = async (playerId: string) => {
    try {
      const q = query(
        collection(db, 'matchHistory'),
        where('player1Id', '==', playerId)
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MatchHistory[]
    } catch (error) {
      console.error('Error getting player match history:', error)
      throw error
    }
  }

  return { matchHistory, loading, addMatchToHistory, getPlayerMatchHistory }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'notifications'), orderBy('timestamp', 'desc')),
      (snapshot) => {
        const notificationsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[]
        setNotifications(notificationsData)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const sendNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        timestamp: Date.now()
      })
      return docRef.id
    } catch (error) {
      console.error('Error sending notification:', error)
      throw error
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      throw error
    }
  }

  return { notifications, loading, sendNotification, markAsRead }
}
