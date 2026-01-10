"use client"

import { useRef, useEffect } from "react"
import gsap from "gsap"

export default function AnimatedGridBackground() {
    const gridRef = useRef<HTMLDivElement>(null)
    const scanLinesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!gridRef.current || !scanLinesRef.current) return

        const ctx = gsap.context(() => {
            // Grid breathing effect
            gsap.to(gridRef.current, {
                opacity: 0.1,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            })

            // Animate horizontal scan lines - stagger across screen
            const hLines = scanLinesRef.current?.querySelectorAll('.h-scan')
            hLines?.forEach((line, i) => {
                gsap.fromTo(line,
                    { top: "-2px" },
                    {
                        top: "100%",
                        duration: 8 + i * 1.5,
                        repeat: -1,
                        ease: "none",
                        delay: i * 3 // More spread out delays
                    }
                )
            })

            // Animate vertical scan lines - match horizontal timing
            const vLines = scanLinesRef.current?.querySelectorAll('.v-scan')
            vLines?.forEach((line, i) => {
                gsap.fromTo(line,
                    { left: "-2px" },
                    {
                        left: "100%",
                        duration: 8 + i * 1.5,
                        repeat: -1,
                        ease: "none",
                        delay: i * 3 // Same timing as horizontal
                    }
                )
            })
        })

        return () => ctx.revert()
    }, [])

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Main Grid Pattern */}
            <div
                ref={gridRef}
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0, 240, 255, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.4) 1px, transparent 1px)
          `,
                    backgroundSize: "50px 50px"
                }}
            />

            {/* Scan Lines Container */}
            <div ref={scanLinesRef} className="absolute inset-0">
                {/* 3 Horizontal Scan Lines (Cyan, Pink, Green) */}
                <div
                    className="h-scan absolute left-0 right-0 h-[1px]"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(0, 240, 255, 0.6), transparent)",
                        boxShadow: "0 0 15px rgba(0, 240, 255, 0.4)"
                    }}
                />
                <div
                    className="h-scan absolute left-0 right-0 h-[1px]"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(255, 0, 128, 0.5), transparent)",
                        boxShadow: "0 0 12px rgba(255, 0, 128, 0.3)"
                    }}
                />
                <div
                    className="h-scan absolute left-0 right-0 h-[1px]"
                    style={{
                        background: "linear-gradient(90deg, transparent, rgba(57, 255, 20, 0.5), transparent)",
                        boxShadow: "0 0 12px rgba(57, 255, 20, 0.3)"
                    }}
                />

                {/* 3 Vertical Scan Lines (Pink, Cyan, Green) */}
                <div
                    className="v-scan absolute top-0 bottom-0 w-[1px]"
                    style={{
                        background: "linear-gradient(180deg, transparent, rgba(255, 0, 128, 0.6), transparent)",
                        boxShadow: "0 0 15px rgba(255, 0, 128, 0.4)"
                    }}
                />
                <div
                    className="v-scan absolute top-0 bottom-0 w-[1px]"
                    style={{
                        background: "linear-gradient(180deg, transparent, rgba(0, 240, 255, 0.5), transparent)",
                        boxShadow: "0 0 12px rgba(0, 240, 255, 0.3)"
                    }}
                />
                <div
                    className="v-scan absolute top-0 bottom-0 w-[1px]"
                    style={{
                        background: "linear-gradient(180deg, transparent, rgba(57, 255, 20, 0.5), transparent)",
                        boxShadow: "0 0 12px rgba(57, 255, 20, 0.3)"
                    }}
                />
            </div>

            {/* Corner Accents - Larger */}
            <div className="absolute top-0 left-0 w-48 h-48 border-l-2 border-t-2 border-primary/25" />
            <div className="absolute top-0 right-0 w-48 h-48 border-r-2 border-t-2 border-secondary/25" />
            <div className="absolute bottom-0 left-0 w-48 h-48 border-l-2 border-b-2 border-secondary/25" />
            <div className="absolute bottom-0 right-0 w-48 h-48 border-r-2 border-b-2 border-primary/25" />

            {/* Radial Gradient Overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)"
                }}
            />
        </div>
    )
}
