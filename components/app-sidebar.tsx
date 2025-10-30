"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Gamepad2, Trophy, Gift, Settings, Info, ChevronDown, Wallet, TrendingUp } from "lucide-react"
import { formatAddress } from "@/lib/game-utils"
import { useNativeBalance } from "@/hooks/use-native-balance"
import { useChainId } from "wagmi"

interface AppSidebarProps {
  account: string | null
  isConnected: boolean
}

export default function AppSidebar({ account, isConnected }: AppSidebarProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(true)

  // Native CELO balance
  const { balance, symbol, isLoading } = useNativeBalance()
  const chainId = useChainId()
  const networkName = useMemo(() => {
    switch (chainId) {
      case 11142220:
        return "Celo Sepolia"
      case 42220:
        return "Celo Mainnet"
      default:
        return chainId ? `Chain ${chainId}` : "Unknown Network"
    }
  }, [chainId])
  const stats = {
    gamesPlayed: 24,
    winRate: 75,
    totalWinnings: "1,250.00",
    currentStreak: 5,
  }

  const navigationItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Gamepad2, label: "Play Games", href: "/play" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: Gift, label: "Rewards", href: "/rewards" },
    { icon: Settings, label: "Settings", href: "/settings" },
    { icon: Info, label: "Chain Info", href: "/chain-info" },
  ]

  if (!isConnected) {
    return null
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border transition-all duration-300 ${
        isExpanded ? "w-64" : "w-20"
      } flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isExpanded && (
          <div className="flex items-center gap-2">
            <Image src="/surge-logo.png" alt="Surge Logo" width={32} height={32} className="w-8 h-8" />
            <span className="font-bold text-foreground">Surge</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {/* Wallet Section */}
      {isExpanded && account && (
        <div className="p-4 border-b border-border space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Wallet</p>
            <p className="text-sm font-mono text-foreground">{formatAddress(account)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Balance</p>
            </div>
            <p className="text-lg font-bold text-primary">
              {isLoading ? "—" : `${balance} ${symbol || "CELO"}`}
            </p>
          </div>
        </div>
      )}

      {/* Stats Section */}
      {isExpanded && (
        <div className="p-4 border-b border-border space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">My Stats</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Games</p>
              <p className="text-lg font-bold text-foreground">{stats.gamesPlayed}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className="text-lg font-bold text-primary">{stats.winRate}%</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Winnings</p>
              <p className="text-sm font-bold text-accent">${stats.totalWinnings}</p>
            </div>
            <div className="bg-background/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Streak</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-secondary" />
                <p className="text-lg font-bold text-secondary">{stats.currentStreak}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-foreground hover:text-primary hover:bg-black"
                } ${!isExpanded && "justify-center"}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && <span>{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {isExpanded && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            <p>{networkName}</p>
            <p className="text-xs mt-1">v1.0.0</p>
          </div>
        </div>
      )}
    </aside>
  )
}
