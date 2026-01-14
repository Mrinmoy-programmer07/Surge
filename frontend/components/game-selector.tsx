"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { GameType } from "@/lib/game-types"
import gsap from "gsap"

interface GameSelectorProps {
  onSelectGame: (game: GameType) => void
}

const GAMES = [
  {
    id: "number-memory" as GameType,
    name: "Number Memory Battle",
    description: "Remember and repeat the number sequence faster than your opponent",
    iconPath: "/icons/number-memory1.png",
    difficulty: "Hard" as const,
    color: "cyan" as const,
  },
  {
    id: "word-scramble" as GameType,
    name: "Word Scramble Duel",
    description: "Unscramble words faster than your opponent",
    iconPath: "/icons/word-scramble1.png",
    difficulty: "Hard" as const,
    color: "pink" as const,
  },
  {
    id: "pattern" as GameType,
    name: "Pattern Predictor",
    description: "Predict the next pattern in the sequence",
    iconPath: "/icons/pattern-predictor1.png",
    difficulty: "Hard" as const,
    color: "gold" as const,
  },
  {
    id: "reflex" as GameType,
    name: "Reflex War",
    description: "Test your reaction time against your opponent",
    iconPath: "/icons/reflex-war1.png",
    difficulty: "Medium" as const,
    color: "orange" as const,
  },
  {
    id: "memory-match" as GameType,
    name: "Memory Match Showdown",
    description: "Match pairs faster than your opponent",
    iconPath: "/icons/memory-match1.png",
    difficulty: "Hard" as const,
    color: "green" as const,
  },
]

// Map colors to CSS classes
const colorClasses = {
  cyan: {
    icon: "bg-primary/20 border-primary/40 shadow-[0_0_15px_rgba(0,240,255,0.2)]",
    hover: "hover:border-primary/60 hover:shadow-[0_0_25px_rgba(0,240,255,0.25)]",
    text: "group-hover:text-primary",
  },
  pink: {
    icon: "bg-secondary/20 border-secondary/40 shadow-[0_0_15px_rgba(255,0,128,0.2)]",
    hover: "hover:border-secondary/60 hover:shadow-[0_0_25px_rgba(255,0,128,0.25)]",
    text: "group-hover:text-secondary",
  },
  green: {
    icon: "bg-accent/20 border-accent/40 shadow-[0_0_15px_rgba(57,255,20,0.2)]",
    hover: "hover:border-accent/60 hover:shadow-[0_0_25px_rgba(57,255,20,0.25)]",
    text: "group-hover:text-accent",
  },
  orange: {
    icon: "bg-warning/20 border-warning/40 shadow-[0_0_15px_rgba(255,107,0,0.2)]",
    hover: "hover:border-warning/60 hover:shadow-[0_0_25px_rgba(255,107,0,0.25)]",
    text: "group-hover:text-warning",
  },
  gold: {
    icon: "bg-yellow-500/20 border-yellow-500/40 shadow-[0_0_15px_rgba(255,215,0,0.2)]",
    hover: "hover:border-yellow-500/60 hover:shadow-[0_0_25px_rgba(255,215,0,0.25)]",
    text: "group-hover:text-yellow-400",
  },
}

// Map difficulty to badge variant
const difficultyVariant = {
  Easy: "easy" as const,
  Medium: "medium" as const,
  Hard: "hard" as const,
}

export default function GameSelector({ onSelectGame }: GameSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Phase 1: GSAP Staggered Entrance Animation
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const cards = containerRef.current?.querySelectorAll('.game-card')

      if (cards) {
        // Set initial state
        gsap.set(cards, {
          opacity: 0,
          y: 60,
          scale: 0.9,
          rotateX: -15,
        })

        // Animate in with stagger
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.2,
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Phase 2: 3D Tilt Effect on Hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    gsap.to(card, {
      rotateY: x * 12,
      rotateX: -y * 12,
      scale: 1.02,
      duration: 0.3,
      ease: 'power2.out'
    })

    // Animate icon on hover
    const icon = card.querySelector('.game-icon')
    if (icon) {
      gsap.to(icon, {
        scale: 1.15,
        y: -8,
        duration: 0.3,
        ease: 'power2.out'
      })
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget
    gsap.to(card, {
      rotateY: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.5,
      ease: 'power3.out'
    })

    // Animate icon back
    const icon = card.querySelector('.game-icon')
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    }
  }

  // Phase 3: Icon Float Animation
  useEffect(() => {
    if (!containerRef.current) return

    const ctx = gsap.context(() => {
      const icons = containerRef.current?.querySelectorAll('.game-icon')

      if (icons) {
        icons.forEach((icon, index) => {
          gsap.to(icon, {
            y: -4,
            duration: 1.5 + index * 0.2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: index * 0.15
          })
        })
      }
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      style={{ perspective: '1000px' }}
    >
      {GAMES.map((game) => {
        const colors = colorClasses[game.color]
        return (
          <Card
            key={game.id}
            className={`game-card p-6 border-border/50 bg-card/60 backdrop-blur-sm transition-colors duration-300 cursor-pointer group ${colors.hover}`}
            onClick={() => onSelectGame(game.id)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Icon Container */}
            <div className={`game-icon w-20 h-20 rounded-xl flex items-center justify-center mb-4 border transition-all duration-300 group-hover:scale-110 overflow-hidden ${colors.icon}`}>
              <Image
                src={game.iconPath}
                alt={game.name}
                width={64}
                height={64}
                className="object-contain"
              />
            </div>

            {/* Title */}
            <h3 className={`text-xl font-bold mb-2 text-foreground transition-colors duration-300 ${colors.text}`}>
              {game.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {game.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <Badge variant={difficultyVariant[game.difficulty]}>
                {game.difficulty}
              </Badge>
              <Button
                size="sm"
                variant="neon-cyan"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectGame(game.id)
                }}
              >
                Play
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
