import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import PageTransitionLoader from "@/components/ui/page-transition-loader"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Surge - Web3 Gaming Platform",
  description: "1v1 skill-based challenges on Celo blockchain",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <PageTransitionLoader>
            {children}
          </PageTransitionLoader>
        </Providers>
      </body>
    </html>
  )
}