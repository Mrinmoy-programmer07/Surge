"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { formatAddress } from "@/lib/game-utils"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { injected, walletConnect } from "wagmi/connectors"

interface WalletConnectProps {
  onConnect: (address: string) => void
  onConnected: (connected: boolean) => void
}

export default function WalletConnect({ onConnect, onConnected }: WalletConnectProps) {
  const { address, isConnected, isConnecting } = useAccount()
  const { connectAsync, status } = useConnect()
  const { disconnect } = useDisconnect()

  useEffect(() => {
    if (isConnected && address) {
      onConnect(address)
      onConnected(true)
    }
    if (!isConnected) {
      onConnected(false)
    }
  }, [isConnected, address, onConnect, onConnected])

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
        <div className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-sm font-medium text-primary">{formatAddress(address)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          className="border-border hover:bg-card bg-transparent"
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
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      {isConnecting || status === "pending" ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}
