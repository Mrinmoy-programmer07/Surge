"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import AppSidebar from "@/components/app-sidebar"
import AppTopbar from "@/components/app-topbar"
import AnimatedGridBackground from "@/components/ui/animated-grid-background"
import FooterNewsTicker from "@/components/footer-news-ticker"
import { useEasterEggs } from "@/hooks/use-easter-eggs"
import { useAccount, useDisconnect } from "wagmi"
import gsap from "gsap"

// Storage key for persisting collapse state
const COLLAPSE_KEY = 'surge-sidebar-collapsed'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()
    const [mounted, setMounted] = useState(false)

    // Initialize from localStorage to match sidebar
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(COLLAPSE_KEY) === 'true'
        }
        return false
    })

    // Ref for main content area
    const contentRef = useRef<HTMLDivElement>(null)

    // Initialize easter eggs
    useEasterEggs({ enabled: true })

    // Handle hydration
    useEffect(() => {
        setMounted(true)
        // Re-check localStorage after mount
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(COLLAPSE_KEY) === 'true'
            setSidebarCollapsed(stored)
        }
    }, [])

    // Redirect to landing if not connected
    useEffect(() => {
        if (mounted && !isConnected) {
            router.push("/")
        }
    }, [mounted, isConnected, router])

    // Handle sidebar collapse - animate main content margin with smooth transition
    const handleSidebarCollapse = (collapsed: boolean) => {
        setSidebarCollapsed(collapsed)

        if (contentRef.current) {
            gsap.to(contentRef.current, {
                marginLeft: collapsed ? 80 : 256,
                duration: 0.6,
                ease: 'power3.inOut'
            })
        }
    }

    const handleDisconnect = () => {
        disconnect()
        router.push("/")
    }

    // Don't render until mounted to avoid hydration issues
    if (!mounted) {
        return null
    }

    // Show nothing while redirecting
    if (!isConnected) {
        return null
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Animated Grid Background - Hidden on rewards page */}
            {pathname !== '/rewards' && <AnimatedGridBackground />}

            {/* Sidebar */}
            <AppSidebar
                isConnected={isConnected}
                onCollapse={handleSidebarCollapse}
            />

            {/* Main content area */}
            <div
                ref={contentRef}
                className="min-h-screen flex flex-col transition-none"
                style={{ marginLeft: sidebarCollapsed ? 80 : 256 }}
            >
                {/* Topbar */}
                <AppTopbar
                    account={address || null}
                    isConnected={isConnected}
                    onDisconnect={handleDisconnect}
                />

                {/* Page content */}
                <main className="flex-1 relative z-10">
                    <div className="container mx-auto px-6 py-6 pb-16">
                        {children}
                    </div>
                </main>
            </div>

            {/* Footer News Ticker */}
            <FooterNewsTicker />
        </div>
    )
}
