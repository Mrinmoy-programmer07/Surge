import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore'

let adminApp: App | null = null
let adminDb: Firestore | null = null

/**
 * Initialize Firebase Admin SDK (for server-side API routes)
 * This uses service account credentials from environment variables
 */
function initFirebaseAdmin() {
    if (adminApp) {
        return { app: adminApp, db: adminDb! }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('⚠️ Firebase Admin credentials not configured')
        return { app: null, db: null }
    }

    try {
        if (!getApps().length) {
            adminApp = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            })
            console.log('✅ Firebase Admin initialized for project:', projectId)
        } else {
            adminApp = getApps()[0]
        }

        adminDb = getFirestore(adminApp)
        return { app: adminApp, db: adminDb }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error)
        return { app: null, db: null }
    }
}

/**
 * Update leaderboard after a game ends
 * Called from declare-winner API route
 */
export async function updateLeaderboardAfterGame(
    winnerAddress: string,
    loserAddress: string,
    winnerPayout: number,
    isDraw: boolean = false
) {
    const { db } = initFirebaseAdmin()

    if (!db) {
        console.warn('⚠️ Firebase Admin not available - skipping leaderboard update')
        return false
    }

    try {
        const normalizedWinner = winnerAddress.toLowerCase()
        const normalizedLoser = loserAddress.toLowerCase()

        if (isDraw) {
            // For draws, just update lastActive for both players
            const winnerRef = db.doc(`players/${normalizedWinner}`)
            const loserRef = db.doc(`players/${normalizedLoser}`)

            await Promise.all([
                winnerRef.set({ lastActive: Date.now() }, { merge: true }),
                loserRef.set({ lastActive: Date.now() }, { merge: true }),
            ])

            console.log('✅ Updated lastActive for draw participants')
            return true
        }

        // Update winner stats
        const winnerRef = db.doc(`players/${normalizedWinner}`)
        await winnerRef.set({
            wins: FieldValue.increment(1),
            totalEarnings: FieldValue.increment(winnerPayout),
            lastActive: Date.now(),
        }, { merge: true })

        // Update loser stats
        const loserRef = db.doc(`players/${normalizedLoser}`)
        await loserRef.set({
            losses: FieldValue.increment(1),
            lastActive: Date.now(),
        }, { merge: true })

        // Update allTime leaderboard
        const leaderboardRef = db.doc('leaderboard/rankings')
        const winnerDoc = await winnerRef.get()

        if (winnerDoc.exists) {
            const data = winnerDoc.data()
            await leaderboardRef.set({
                allTime: {
                    [normalizedWinner]: {
                        playerId: normalizedWinner,
                        username: data?.username || winnerAddress,
                        wins: data?.wins || 1,
                        totalEarnings: data?.totalEarnings || winnerPayout,
                    }
                }
            }, { merge: true })
        }

        console.log('✅ Updated Firebase leaderboard - Winner:', normalizedWinner, 'Payout:', winnerPayout)
        return true
    } catch (error) {
        console.error('❌ Error updating leaderboard:', error)
        return false
    }
}

/**
 * Get Firebase Admin Firestore instance
 * For direct access if needed
 */
export function getAdminFirestore() {
    const { db } = initFirebaseAdmin()
    return db
}

export { FieldValue }
