import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Exo_2, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import PageTransitionLoader from "@/components/ui/page-transition-loader"

// Cyberpunk-themed fonts
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const exo2 = Exo_2({
  subsets: ["latin"],
  variable: "--font-exo2",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Surge - Web3 Gaming Platform",
  description: "1v1 skill-based challenges on Arbitrum blockchain",
  generator: "v0.app",
  icons: {
    icon: "/logo-fevicon.png",
    shortcut: "/logo-fevicon.png",
    apple: "/logo-fevicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${orbitron.variable} ${exo2.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="font-body antialiased">
        <Providers>
          <PageTransitionLoader>
            {children}
          </PageTransitionLoader>
        </Providers>
      </body>
    </html>
  )
}