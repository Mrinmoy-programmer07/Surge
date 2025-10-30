"use client"

import { http } from "wagmi"
import { createConfig } from "wagmi"
import { celoSepoliaTestnet } from "@/lib/chains"
import { injected } from "wagmi/connectors"
import { walletConnect } from "wagmi/connectors"

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || ""

export const wagmiConfig = createConfig({
  chains: [celoSepoliaTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: "Surge",
        description: "Instant P2P competitive gaming on Celo",
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        icons: [
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/surge-logo.png`,
        ],
      },
    }),
  ],
  ssr: true,
  transports: {
    [celoSepoliaTestnet.id]: http(celoSepoliaTestnet.rpcUrls.default.http[0]),
  },
})
