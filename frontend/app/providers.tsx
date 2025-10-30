"use client"

import type React from "react"
import { GameStateProvider } from "@/lib/game-state-context"
import dynamic from "next/dynamic"

const WalletProvider = dynamic(
  () => import("@/components/wallet-provider").then((m) => m.WalletProvider),
  { ssr: false },
)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <GameStateProvider>{children}</GameStateProvider>
    </WalletProvider>
  )
}