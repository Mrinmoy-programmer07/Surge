import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc,
  deleteDoc 
} from 'firebase/firestore'
import { db } from './firebase'

export interface MatchmakingEntry {
  id: string
  playerAddress: string
  gameType: string
  stake: number
  timestamp: number
  status: 'waiting' | 'matched' | 'cancelled'
}

export class MatchmakingService {
  static async findMatch(playerAddress: string, gameType: string, stake: number): Promise<string | null> {
    try {
      console.log('🔍 Searching for match:', { playerAddress, gameType, stake })
      
      // Look for other players waiting for the same game type and stake
      const q = query(
        collection(db, 'matchmakingQueue'),
        where('gameType', '==', gameType),
        where('stake', '==', stake),
        where('status', '==', 'waiting'),
        where('playerAddress', '!=', playerAddress)
      )

      const querySnapshot = await getDocs(q)
      console.log('📊 Found', querySnapshot.size, 'potential opponents')
      
      if (!querySnapshot.empty) {
        // Found a match - get the first available opponent
        const opponentDoc = querySnapshot.docs[0]
        const opponentId = opponentDoc.id
        const opponentAddress = opponentDoc.data().playerAddress
        
        console.log('🎯 Found opponent:', { opponentId, opponentAddress })
        
        // Update both players' status to 'matched' in parallel
        await Promise.all([
          updateDoc(doc(db, 'matchmakingQueue', opponentId), {
            status: 'matched'
          }),
          this.updateCurrentPlayerStatus(playerAddress, gameType, stake)
        ])

        console.log('✅ Both players marked as matched')
        return opponentAddress
      }

      console.log('❌ No match found')
      return null
    } catch (error) {
      console.error('Error finding match:', error)
      throw error
    }
  }

  private static async updateCurrentPlayerStatus(playerAddress: string, gameType: string, stake: number): Promise<void> {
    try {
      const currentPlayerQuery = query(
        collection(db, 'matchmakingQueue'),
        where('playerAddress', '==', playerAddress),
        where('gameType', '==', gameType),
        where('stake', '==', stake),
        where('status', '==', 'waiting')
      )

      const currentPlayerSnapshot = await getDocs(currentPlayerQuery)
      if (!currentPlayerSnapshot.empty) {
        const currentPlayerId = currentPlayerSnapshot.docs[0].id
        await updateDoc(doc(db, 'matchmakingQueue', currentPlayerId), {
          status: 'matched'
        })
        console.log('✅ Current player marked as matched:', currentPlayerId)
      }
    } catch (error) {
      console.error('Error updating current player status:', error)
      throw error
    }
  }

  static async cleanupMatchedEntries(): Promise<void> {
    try {
      // Find all matched entries older than 5 minutes and remove them
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      
      const q = query(
        collection(db, 'matchmakingQueue'),
        where('status', '==', 'matched'),
        where('timestamp', '<', fiveMinutesAgo)
      )

      const querySnapshot = await getDocs(q)
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )

      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Error cleaning up matched entries:', error)
    }
  }

  static async removePlayerFromQueue(playerAddress: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'matchmakingQueue'),
        where('playerAddress', '==', playerAddress),
        where('status', '==', 'waiting')
      )

      const querySnapshot = await getDocs(q)
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )

      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Error removing player from queue:', error)
    }
  }
}
