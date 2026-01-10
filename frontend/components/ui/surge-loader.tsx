"use client"

import React, { useEffect, useRef } from "react"
import Image from "next/image"
import gsap from "gsap"

export default function SurgeLoader() {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const ringsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      // Logo float animation
      if (logoRef.current) {
        gsap.to(logoRef.current, {
          y: -8,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      }

      // Rotating rings animation
      if (ringsRef.current) {
        const rings = ringsRef.current.querySelectorAll('.loader-ring')
        rings.forEach((ring, i) => {
          gsap.to(ring, {
            rotation: i % 2 === 0 ? 360 : -360,
            duration: 3 + i * 0.5,
            repeat: -1,
            ease: 'none'
          })
        })
      }

      // Loading bars wave animation
      if (barsRef.current) {
        const bars = barsRef.current.querySelectorAll('.loader-bar')
        bars.forEach((bar, i) => {
          gsap.to(bar, {
            scaleY: 1,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
            delay: i * 0.1
          })
        })
      }

      // Text glow pulse animation
      if (textRef.current) {
        gsap.to(textRef.current, {
          textShadow: '0 0 30px rgba(0, 240, 255, 1), 0 0 60px rgba(0, 240, 255, 0.5)',
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-cyber-grid opacity-15" />
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

      {/* Scanning line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan" />
      </div>

      {/* Corner HUD elements */}
      <div className="absolute top-4 left-4 flex flex-col gap-1">
        <div className="w-16 h-0.5 bg-primary/60" />
        <div className="w-8 h-0.5 bg-primary/40" />
      </div>
      <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
        <div className="w-16 h-0.5 bg-secondary/60" />
        <div className="w-8 h-0.5 bg-secondary/40" />
      </div>
      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
        <div className="w-8 h-0.5 bg-secondary/40" />
        <div className="w-16 h-0.5 bg-secondary/60" />
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 items-end">
        <div className="w-8 h-0.5 bg-primary/40" />
        <div className="w-16 h-0.5 bg-primary/60" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Rotating rings around logo */}
        <div ref={ringsRef} className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer ring */}
          <div className="loader-ring absolute inset-0 border-2 border-primary/30 rounded-full border-t-primary border-r-transparent" />
          {/* Middle ring */}
          <div className="loader-ring absolute inset-2 border-2 border-secondary/20 rounded-full border-b-secondary border-l-transparent" />
          {/* Inner ring */}
          <div className="loader-ring absolute inset-4 border border-primary/40 rounded-full border-t-primary/80" />

          {/* Logo with glow */}
          <div ref={logoRef} className="relative z-10">
            <div className="absolute inset-0 bg-primary/50 blur-2xl rounded-full scale-150" />
            <Image
              src="/surge-logo.png"
              alt="Surge"
              width={56}
              height={56}
              className="relative w-14 h-14 drop-shadow-[0_0_25px_rgba(0,240,255,0.9)]"
            />
          </div>
        </div>

        {/* SURGE text with glow */}
        <div ref={textRef} className="mt-6 text-center">
          <h1 className="text-2xl font-bold tracking-[0.4em] text-primary">
            SURGE
          </h1>
        </div>

        {/* Loading bars */}
        <div ref={barsRef} className="flex items-end gap-1 h-6 mt-6">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="loader-bar w-1 bg-gradient-to-t from-primary/80 to-primary rounded-full origin-bottom"
              style={{
                height: `${10 + Math.abs(3 - i) * 4}px`,
                transform: 'scaleY(0.2)'
              }}
            />
          ))}
        </div>

        {/* Status text */}
        <p className="text-xs text-muted-foreground/60 mt-4 tracking-widest uppercase">
          Connecting to Arena
        </p>

        {/* Progress dots */}
        <div className="flex gap-2 mt-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
