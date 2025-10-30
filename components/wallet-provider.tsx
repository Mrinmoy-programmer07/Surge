"use client"

import { PropsWithChildren, useMemo } from "react"
import { WagmiProvider } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { wagmiConfig } from "@/lib/wagmi"

export function WalletProvider({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => new QueryClient(), [])
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
