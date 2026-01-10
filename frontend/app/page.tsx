"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import WalletConnect from "@/components/wallet-connect"
import { useAccount } from "wagmi"
import gsap from "gsap"

export default function Home() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  // Refs for GSAP animations
  const logoRef = useRef<HTMLImageElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const heroCardRef = useRef<HTMLDivElement>(null)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect to games if already connected
  useEffect(() => {
    if (mounted && isConnected) {
      router.push("/games")
    }
  }, [mounted, isConnected, router])

  // GSAP Logo Pulse Animation
  useEffect(() => {
    if (!logoRef.current) return

    const ctx = gsap.context(() => {
      gsap.to(logoRef.current, {
        filter: 'drop-shadow(0 0 25px rgba(0, 240, 255, 0.8))',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      })
    })

    return () => ctx.revert()
  }, [])

  // GSAP Hero Card Entrance Animation
  useEffect(() => {
    if (!heroCardRef.current || !mounted) return

    const ctx = gsap.context(() => {
      gsap.fromTo(heroCardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
      )
    })

    return () => ctx.revert()
  }, [mounted])

  // GSAP Title Animation
  useEffect(() => {
    if (!titleRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(titleRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }
      )
    })

    return () => ctx.revert()
  }, [])

  // Handlers for WalletConnect
  const handleConnect = (address: string) => {
    // Address received, redirect will happen via useEffect
  }

  const handleConnected = (connected: boolean) => {
    if (connected) {
      router.push("/games")
    }
  }

  // Show nothing while checking connection
  if (!mounted) {
    return null
  }

  // If connected, show loading while redirecting
  if (isConnected) {
    return (
      <main className="min-h-screen bg-background bg-cyber-grid flex items-center justify-center">
        <div className="text-primary text-xl animate-pulse">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background bg-cyber-grid relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-cyber-radial pointer-events-none" />
      <div className="fixed top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30 pointer-events-none" />
      <div className="fixed top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-secondary/30 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-secondary/30 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30 pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3 group">
            <Image
              ref={logoRef}
              src="/surge-logo.png"
              alt="Surge Logo"
              width={48}
              height={48}
              className="w-12 h-12 transition-transform group-hover:scale-110"
            />
            <h1
              ref={titleRef}
              className="text-3xl font-bold text-foreground text-glow-cyan"
            >
              Surge
            </h1>
          </div>
          <WalletConnect onConnect={handleConnect} onConnected={handleConnected} />
        </div>

        {/* Hero Card */}
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card
            ref={heroCardRef}
            className="w-full max-w-md p-8 text-center border-primary/20 bg-card/80 backdrop-blur-sm hover-glow-cyan opacity-0"
          >
            <div className="mb-6">
              <span className="text-5xl">⚡</span>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to start competing in skill-based challenges on{" "}
              <span className="text-warning">Arbitrum</span>
            </p>
            <WalletConnect onConnect={handleConnect} onConnected={handleConnected} />

            {/* Feature highlights */}
            <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl mb-1">🎮</p>
                <p className="text-xs text-muted-foreground">5 Games</p>
              </div>
              <div>
                <p className="text-2xl mb-1">⚔️</p>
                <p className="text-xs text-muted-foreground">1v1 PvP</p>
              </div>
              <div>
                <p className="text-2xl mb-1">💰</p>
                <p className="text-xs text-muted-foreground">Win ETH</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
