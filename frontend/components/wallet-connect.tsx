"use client"

import { useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { formatAddress } from "@/lib/game-utils"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { injected, walletConnect } from "wagmi/connectors"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db, isFirebaseAvailable } from "@/lib/firebase"
import ChainSwitcher from "@/components/chain-switcher"

interface WalletConnectProps {
  onConnect: (address: string) => void
  onConnected: (connected: boolean) => void
}

export default function WalletConnect({ onConnect, onConnected }: WalletConnectProps) {
  const { address, isConnected, isConnecting } = useAccount()
  const { connectAsync, status } = useConnect()
  const { disconnect } = useDisconnect()
  const profileCheckedRef = useRef<string | null>(null)

  // Ensure player profile exists in Firebase
  const ensurePlayerProfile = useCallback(async (walletAddress: string) => {
    // Skip if already checked for this address
    if (profileCheckedRef.current === walletAddress.toLowerCase()) {
      return
    }

    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available - skipping profile creation')
      return
    }

    try {
      const normalizedAddress = walletAddress.toLowerCase()
      const playerRef = doc(db, 'players', normalizedAddress)
      const playerDoc = await getDoc(playerRef)

      if (!playerDoc.exists()) {
        // Create new player profile with wallet address as username
        await setDoc(playerRef, {
          username: walletAddress, // Full address as username
          walletAddress: normalizedAddress,
          wins: 0,
          losses: 0,
          totalEarnings: 0,
          createdAt: Date.now(),
          lastActive: Date.now(),
        })
        console.log('✅ Created Firebase profile for', walletAddress)
      } else {
        // Update last active timestamp for returning users
        await setDoc(playerRef, { lastActive: Date.now() }, { merge: true })
        console.log('✅ Updated lastActive for', walletAddress)
      }

      profileCheckedRef.current = normalizedAddress
    } catch (error) {
      console.error('❌ Error ensuring player profile:', error)
    }
  }, [])

  useEffect(() => {
    if (isConnected && address) {
      onConnect(address)
      onConnected(true)
      // Create/update Firebase player profile
      ensurePlayerProfile(address)
    }
    if (!isConnected) {
      onConnected(false)
      profileCheckedRef.current = null
    }
  }, [isConnected, address, onConnect, onConnected, ensurePlayerProfile])

  const handleConnect = async () => {
    try {
      // Try injected first (MetaMask, etc.)
      await connectAsync({ connector: injected({ shimDisconnect: true }) })
    } catch (e) {
      try {
        // Fallback to WalletConnect (Valora, MiniPay, Ledger via WC)
        await connectAsync({ connector: walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "" }) })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Wallet connect error", err)
      }
    }
  }

  const handleDisconnect = () => {
    disconnect()
    onConnected(false)
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <ChainSwitcher />
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="border-destructive/30 text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting || status === "pending"}
      variant="neon-cyan"
      className={isConnecting || status === "pending" ? "opacity-70" : ""}
    >
      {isConnecting || status === "pending" ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          Connecting...
        </span>
      ) : (
        "Connect Wallet"
      )}
    </Button>
  )
}

