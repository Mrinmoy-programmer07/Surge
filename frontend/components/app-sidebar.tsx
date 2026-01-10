"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Gamepad2, Trophy, Gift, ChevronLeft, ChevronRight } from "lucide-react"
import gsap from "gsap"

interface AppSidebarProps {
  isConnected: boolean
  onCollapse?: (collapsed: boolean) => void
}

// Storage key for persisting collapse state
const COLLAPSE_KEY = 'surge-sidebar-collapsed'

export default function AppSidebar({ isConnected, onCollapse }: AppSidebarProps) {
  const pathname = usePathname()

  // Initialize from localStorage if available
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(COLLAPSE_KEY) === 'true'
    }
    return false
  })

  // Refs for GSAP animations
  const sidebarRef = useRef<HTMLElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const logoTextRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const glowRef = useRef<HTMLDivElement>(null)
  const logoImageRef = useRef<HTMLImageElement>(null)

  const navigationItems = [
    { icon: Gamepad2, label: "Games", href: "/games" },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: Gift, label: "Rewards", href: "/rewards" },
  ]

  // Persist collapse state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COLLAPSE_KEY, String(isCollapsed))
    }
  }, [isCollapsed])

  // Notify parent of initial collapse state
  useEffect(() => {
    onCollapse?.(isCollapsed)
  }, []) // Only on mount

  // Handle collapse toggle with smooth premium GSAP animation
  const handleToggle = useCallback(() => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapse?.(newCollapsed)

    if (!sidebarRef.current) return

    // Create a master timeline for coordinated animations
    // SLOWER, SMOOTHER for premium feel
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })

    // Subtle glow pulse effect
    if (glowRef.current) {
      gsap.fromTo(glowRef.current,
        { opacity: 0 },
        {
          opacity: 0.3,
          duration: 0.4,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut'
        }
      )
    }

    if (newCollapsed) {
      // Collapsing animation - slow and smooth
      tl.to(labelRefs.current.filter(Boolean), {
        opacity: 0,
        x: -10,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.inOut'
      })
        .to(logoTextRef.current, {
          opacity: 0,
          x: -10,
          duration: 0.35,
        }, '<0.1')
        .to(footerRef.current, {
          opacity: 0,
          duration: 0.3,
        }, '<0.1')
        .to(sidebarRef.current, {
          width: 80,
          duration: 0.6,
          ease: 'power3.inOut'
        }, '-=0.2')

    } else {
      // Expanding animation - smooth and premium
      tl.to(sidebarRef.current, {
        width: 256,
        duration: 0.6,
        ease: 'power3.inOut'
      })
        .to(logoTextRef.current, {
          opacity: 1,
          x: 0,
          duration: 0.4,
          ease: 'power2.out'
        }, '-=0.3')
        .to(labelRefs.current.filter(Boolean), {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power2.out'
        }, '-=0.35')
        .to(footerRef.current, {
          opacity: 1,
          duration: 0.35,
        }, '-=0.3')
    }
  }, [isCollapsed, onCollapse])

  // GSAP Sidebar Entrance Animation
  useEffect(() => {
    if (!sidebarRef.current || !isConnected) return

    // Set initial width based on collapsed state
    gsap.set(sidebarRef.current, { width: isCollapsed ? 80 : 256 })

    const ctx = gsap.context(() => {
      gsap.fromTo(sidebarRef.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
      )
    })

    return () => ctx.revert()
  }, [isConnected])

  // GSAP Navigation Stagger Animation
  useEffect(() => {
    if (!navRef.current || !isConnected) return

    const ctx = gsap.context(() => {
      const navItems = navRef.current?.querySelectorAll('.nav-item')
      if (navItems) {
        gsap.fromTo(navItems,
          { opacity: 0, x: -15 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            delay: 0.5
          }
        )
      }
    })

    return () => ctx.revert()
  }, [isConnected])

  // GSAP Logo Continuous Animation
  useEffect(() => {
    if (!logoImageRef.current || !isConnected) return

    const ctx = gsap.context(() => {
      // Floating animation
      gsap.to(logoImageRef.current, {
        y: -4,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })

      // Glow pulse animation
      gsap.to(logoImageRef.current, {
        filter: 'drop-shadow(0 0 25px rgba(0, 240, 255, 1))',
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      })
    })

    return () => ctx.revert()
  }, [isConnected])

  if (!isConnected) {
    return null
  }

  return (
    <>
      <aside
        ref={sidebarRef}
        className="fixed left-0 top-0 h-screen bg-black/95 backdrop-blur-xl border-r border-primary/20 flex flex-col z-50"
        style={{ width: isCollapsed ? 80 : 256 }}
      >
        {/* Subtle glow effect overlay */}
        <div
          ref={glowRef}
          className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/15 opacity-0 pointer-events-none"
        />

        {/* Logo Header - Premium Branding */}
        <div className="p-4 border-b border-primary/20">
          <Link href="/games" className="flex items-center gap-3 group">
            {/* Logo with animated ring */}
            <div className="relative flex-shrink-0">
              {/* Outer pulsing ring */}
              <div className="absolute -inset-1 rounded-full border border-primary/30 animate-pulse" />
              {/* Rotating gradient ring */}
              <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-primary via-secondary to-primary opacity-20 animate-[spin_8s_linear_infinite]" />
              {/* Inner glow */}
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full group-hover:bg-primary/50 transition-all duration-500" />
              {/* Logo image with GSAP animation */}
              <Image
                ref={logoImageRef}
                src="/surge-logo.png"
                alt="Surge"
                width={44}
                height={44}
                className="logo-image relative w-11 h-11 drop-shadow-[0_0_15px_rgba(0,240,255,0.7)]"
              />
            </div>
            {/* Brand text */}
            {!isCollapsed && (
              <div ref={logoTextRef} className="flex flex-col">
                <span
                  className="text-3xl font-normal tracking-wide text-white drop-shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                  style={{ fontFamily: "'Turbo Raider', sans-serif" }}
                >
                  SURGE
                </span>
                <span className="text-[10px] text-muted-foreground/60 tracking-widest uppercase -mt-0.5">
                  Gaming Arena
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation - Centered */}
        <nav ref={navRef} className={`flex-1 flex flex-col justify-center space-y-3 ${isCollapsed ? 'px-3' : 'p-4'}`}>
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className="nav-item block group/nav"
                title={isCollapsed ? item.label : undefined}
              >
                <div
                  className={`
                    relative flex items-center rounded-xl
                    transition-all duration-300
                    ${isCollapsed ? 'justify-center px-2 py-3' : 'gap-4 px-4 py-3'}
                    ${isActive
                      ? "bg-primary/15 border border-primary/50 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                      : "hover:bg-card/50 border border-transparent hover:border-primary/20"
                    }
                  `}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r shadow-[0_0_12px_rgba(0,240,255,0.8)]" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-xl" />
                    </>
                  )}

                  {/* Icon container */}
                  <div className={`
                    p-2.5 rounded-lg transition-all duration-300 flex-shrink-0 relative z-10
                    ${isActive
                      ? "bg-primary/20 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                      : "bg-card/30 group-hover/nav:bg-primary/10"
                    }
                  `}>
                    <Icon className={`
                      w-5 h-5 transition-all duration-300
                      ${isActive
                        ? "text-primary drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]"
                        : "text-muted-foreground group-hover/nav:text-primary"
                      }
                    `} />
                  </div>

                  {/* Label */}
                  {!isCollapsed && (
                    <span
                      ref={el => { labelRefs.current[index] = el }}
                      className={`
                        font-medium transition-all duration-300 whitespace-nowrap relative z-10
                        ${isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover/nav:text-foreground"
                        }
                      `}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div ref={footerRef} className="p-4 border-t border-primary/10">
            <p className="text-xs text-muted-foreground/50 text-center">
              Surge Gaming v1.0
            </p>
          </div>
        )}
      </aside>

      {/* Toggle Button - Outside sidebar to prevent clipping */}
      <button
        onClick={handleToggle}
        className="fixed top-20 z-50 w-6 h-14 bg-card/90 border border-primary/30 rounded-r-lg flex items-center justify-center cursor-pointer hover:bg-primary/20 hover:border-primary/50 transition-all duration-400 group shadow-lg"
        style={{ left: isCollapsed ? 80 : 256 }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors duration-300" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors duration-300" />
        )}
      </button>
    </>
  )
}
