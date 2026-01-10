"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import gsap from "gsap"

// Easter Egg Types
type EasterEgg = "minecraft-block" | "leap-of-faith" | "impostor"

interface UseEasterEggsOptions {
  enabled?: boolean
}

export function useEasterEggs(options: UseEasterEggsOptions = { enabled: true }) {
  const [triggeredEggs, setTriggeredEggs] = useState<Set<EasterEgg>>(new Set())
  const clickCountRef = useRef(0)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollRef = useRef(0)
  const scrollSpeedRef = useRef(0)

  // ==========================================
  // 1. MINECRAFT BLOCK BREAK - Rapid clicks
  // ==========================================
  const createBlockParticles = useCallback((x: number, y: number) => {
    const colors = ["#8B4513", "#654321", "#228B22", "#808080", "#D2691E"]
    const particleCount = 12

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div")
      particle.className = "minecraft-particle"
      particle.style.cssText = `
        position: fixed;
        width: 8px;
        height: 8px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 9999;
        left: ${x}px;
        top: ${y}px;
        image-rendering: pixelated;
      `
      document.body.appendChild(particle)

      gsap.to(particle, {
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100 + 50,
        opacity: 0,
        rotation: Math.random() * 360,
        duration: 0.6,
        ease: "power2.out",
        onComplete: () => particle.remove()
      })
    }
  }, [])

  const handleClick = useCallback((e: MouseEvent) => {
    clickCountRef.current++
    
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }

    // After 5 rapid clicks in 1 second, trigger block break
    if (clickCountRef.current >= 5) {
      createBlockParticles(e.clientX, e.clientY)
      clickCountRef.current = 0
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0
    }, 1000)
  }, [createBlockParticles])

  // ==========================================
  // 2. ASSASSIN'S CREED LEAP OF FAITH - Fast scroll
  // ==========================================
  const createFeatherParticles = useCallback(() => {
    const featherCount = 15
    
    for (let i = 0; i < featherCount; i++) {
      const feather = document.createElement("div")
      feather.innerHTML = "🪶"
      feather.style.cssText = `
        position: fixed;
        font-size: ${16 + Math.random() * 16}px;
        pointer-events: none;
        z-index: 9999;
        left: ${Math.random() * window.innerWidth}px;
        top: -30px;
        opacity: 0.8;
      `
      document.body.appendChild(feather)

      gsap.to(feather, {
        y: window.innerHeight + 50,
        x: `+=${(Math.random() - 0.5) * 200}`,
        rotation: Math.random() * 360,
        duration: 2 + Math.random() * 2,
        ease: "power1.inOut",
        onComplete: () => feather.remove()
      })
    }
  }, [])

  const handleScroll = useCallback(() => {
    const currentScroll = window.scrollY
    const scrollDelta = currentScroll - lastScrollRef.current
    lastScrollRef.current = currentScroll

    // Detect fast downward scroll
    if (scrollDelta > 100) {
      scrollSpeedRef.current += scrollDelta
      
      // If accumulated fast scroll > 500px, trigger leap of faith
      if (scrollSpeedRef.current > 500) {
        createFeatherParticles()
        scrollSpeedRef.current = 0
      }
    } else {
      scrollSpeedRef.current = Math.max(0, scrollSpeedRef.current - 50)
    }
  }, [createFeatherParticles])

  // ==========================================
  // 4. AMONG US IMPOSTOR - 1% chance on load
  // ==========================================
  const triggerImpostor = useCallback(() => {
    const sus = document.createElement("div")
    sus.innerHTML = "📮 SUS"
    sus.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      font-size: 24px;
      font-weight: bold;
      color: #ff0000;
      text-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
      z-index: 9999;
      pointer-events: none;
      font-family: var(--font-orbitron), sans-serif;
    `
    document.body.appendChild(sus)

    gsap.fromTo(sus, 
      { opacity: 0, scale: 0.5, y: -20 },
      { 
        opacity: 1, 
        scale: 1, 
        y: 0, 
        duration: 0.3,
        ease: "back.out",
        onComplete: () => {
          gsap.to(sus, {
            opacity: 0,
            y: -20,
            delay: 1.5,
            duration: 0.3,
            onComplete: () => sus.remove()
          })
        }
      }
    )
  }, [])

  // ==========================================
  // Setup Effect
  // ==========================================
  useEffect(() => {
    if (!options.enabled) return

    // Add event listeners
    document.addEventListener("click", handleClick)
    window.addEventListener("scroll", handleScroll)

    // 1% chance to trigger impostor on mount
    if (Math.random() < 0.01) {
      setTimeout(triggerImpostor, 2000) // Delay for dramatic effect
    }

    return () => {
      document.removeEventListener("click", handleClick)
      window.removeEventListener("scroll", handleScroll)
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [options.enabled, handleClick, handleScroll, triggerImpostor])

  return { triggeredEggs }
}
