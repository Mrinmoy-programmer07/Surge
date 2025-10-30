"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { auth, isFirebaseAvailable } from '@/lib/firebase'

interface FirebaseContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if Firebase is available
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available - running in offline mode')
      setError('Firebase configuration not found. Please check your .env.local file.')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed:', user ? `User ${user.uid}` : 'No user')
      
      if (!user) {
        // Automatically sign in anonymously if no user
        try {
          console.log('🔐 No user found, signing in anonymously...')
          setError(null)
          await signInAnonymously(auth)
          console.log('✅ Anonymous sign-in successful')
        } catch (error) {
          console.error('❌ Error signing in anonymously:', error)
          setError('Failed to sign in to Firebase')
        }
      } else {
        console.log('✅ User signed in:', user.uid)
        setError(null)
      }
      
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available - cannot sign in')
      setError('Firebase not available')
      return
    }
    
    try {
      await signInAnonymously(auth)
    } catch (error) {
      console.error('Error signing in:', error)
      setError('Failed to sign in')
    }
  }

  const signOut = async () => {
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available - cannot sign out')
      return
    }
    
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
  }

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider')
  }
  return context
}
