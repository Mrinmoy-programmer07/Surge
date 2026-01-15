"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import ChainSwitcher from "@/components/chain-switcher"
import { formatAddress } from "@/lib/game-utils"
import { useNativeBalance } from "@/hooks/use-native-balance"
import { useDisconnect } from "wagmi"
import { Wallet, LogOut, Copy, Check } from "lucide-react"
import { useState } from "react"
import gsap from "gsap"

interface AppTopbarProps {
    account: string | null
    isConnected: boolean
    onDisconnect: () => void
}

export default function AppTopbar({ account, isConnected, onDisconnect }: AppTopbarProps) {
    const topbarRef = useRef<HTMLDivElement>(null)
    const { balance, symbol, isLoading } = useNativeBalance()
    const { disconnect } = useDisconnect()
    const [copied, setCopied] = useState(false)

    // GSAP Entrance Animation
    useEffect(() => {
        if (!topbarRef.current || !isConnected) return

        const ctx = gsap.context(() => {
            gsap.fromTo(topbarRef.current,
                { y: -50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.2 }
            )
        })

        return () => ctx.revert()
    }, [isConnected])

    const handleDisconnect = () => {
        disconnect()
        onDisconnect()
    }

    const handleCopyAddress = async () => {
        if (!account) return
        await navigator.clipboard.writeText(account)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!isConnected || !account) {
        return null
    }

    return (
        <header
            ref={topbarRef}
            className="sticky top-0 z-40 w-full h-16 bg-black/80 backdrop-blur-xl relative"
        >
            {/* Bottom accent line - positioned below the header */}
            <div className="absolute left-0 right-0 bottom-[-8px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="h-full px-6 flex items-center justify-end gap-4">
                {/* Balance Display */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-primary/20">
                    <div className="p-1.5 rounded-lg bg-accent/20">
                        <Wallet className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Balance</span>
                        <span className="text-sm font-bold text-accent text-glow-green">
                            {isLoading ? "..." : `${balance} ${symbol || "MNT"}`}
                        </span>
                    </div>
                </div>

                {/* Wallet Address */}
                <button
                    onClick={handleCopyAddress}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card/50 border border-primary/20 hover:border-primary/40 transition-all group cursor-pointer"
                >
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Wallet</span>
                        <span className="text-sm font-mono text-foreground group-hover:text-primary transition-colors">
                            {formatAddress(account)}
                        </span>
                    </div>
                    {copied ? (
                        <Check className="w-4 h-4 text-accent" />
                    ) : (
                        <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </button>

                {/* Chain Switcher */}
                <ChainSwitcher />

                {/* Disconnect Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDisconnect}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Disconnect</span>
                </Button>
            </div>
        </header>
    )
}
