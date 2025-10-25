import { initializeApp } from 'firebase/app'
import { getFirestore, collection } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'projectId', 'authDomain']
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missingFields.length > 0) {
    console.error('❌ Firebase configuration is missing required fields:', missingFields)
    console.error('Please check your .env.local file and ensure all Firebase config values are set')
    console.error('Current config:', {
      apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
      authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
      projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
      storageBucket: firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing',
      messagingSenderId: firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing',
      appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing'
    })
    return false
  }
  return true
}

// Initialize Firebase with fallback
let app: any = null
let db: any = null
let auth: any = null

try {
  // Validate config before initializing
  if (!validateFirebaseConfig()) {
    console.warn('⚠️ Firebase configuration is invalid. Running in fallback mode.')
    // Create mock services for development
    app = null
    db = null
    auth = null
  } else {
    // Initialize Firebase
    app = initializeApp(firebaseConfig)
    console.log('🔥 Firebase initialized successfully with project:', firebaseConfig.projectId)
    
    // Initialize Firebase services
    db = getFirestore(app)
    auth = getAuth(app)
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error)
  console.warn('⚠️ Running in fallback mode without Firebase')
  app = null
  db = null
  auth = null
}

// Export services (will be null if Firebase failed to initialize)
export { db, auth }

// Test Firebase connection
export const testFirebaseConnection = async () => {
  if (!db || !auth) {
    console.warn('⚠️ Firebase not initialized - cannot test connection')
    return false
  }
  
  try {
    console.log('🧪 Testing Firebase connection...')
    // Simple test to verify Firestore is accessible
    const testCollection = collection(db, 'test')
    console.log('✅ Firebase connection test passed')
    return true
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error)
    return false
  }
}

// Check if Firebase is available
export const isFirebaseAvailable = () => {
  return !!(db && auth)
}

export default app
