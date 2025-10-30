"use client"

import { useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import WalletConnect from "@/components/wallet-connect"
import GameLobby from "@/components/game-lobby"
import AppSidebar from "@/components/app-sidebar"
import { useDisconnect } from "wagmi"

export default function Home() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { disconnect } = useDisconnect()

  const handleDisconnect = () => {
    // Ensure on-chain connector is actually disconnected
    try {
      disconnect()
    } catch {}
    setAccount(null)
    setIsConnected(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <AppSidebar account={account} isConnected={isConnected} />

      <div className={`transition-all duration-300 ${isConnected ? "ml-64" : ""}`}>
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <Image src="/surge-logo.png" alt="Surge Logo" width={40} height={40} className="w-10 h-10" />
              <h1 className="text-3xl font-bold text-foreground">Surge</h1>
            </div>
            {isConnected ? (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="border-border hover:bg-card bg-transparent"
              >
                Disconnect
              </Button>
            ) : (
              <WalletConnect onConnect={setAccount} onConnected={setIsConnected} />
            )}
          </div>

          {/* Main Content */}
          {!isConnected ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Card className="w-full max-w-md p-8 text-center border-border">
                <h2 className="text-2xl font-bold mb-4 text-foreground">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your Celo wallet to start competing in skill-based challenges
                </p>
                <WalletConnect onConnect={setAccount} onConnected={setIsConnected} />
              </Card>
            </div>
          ) : (
            <GameLobby account={account || ""} onDisconnect={handleDisconnect} />
          )}
        </div>
      </div>
    </main>
  )
}
