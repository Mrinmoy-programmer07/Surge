"use client"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import gsap from "gsap"
import PopArtTitle from "@/components/ui/pop-art-title"

interface GameResultCardProps {
    isWinner: boolean
    isDraw: boolean
    myScore: number
    opponentScore: number
    opponentName: string
    stake: string
    winnerPayout: string
    platformFee: string
    matchId: string
    matchStatus: string
    withdrawn: boolean
    withdrawing: boolean
    withdrawTxHash: string | null
    onWithdraw: (isDraw: boolean) => void
    onPlayAgain: () => void
}

export default function GameResultCard({
    isWinner,
    isDraw,
    myScore,
    opponentScore,
    opponentName,
    stake,
    winnerPayout,
    platformFee,
    matchId,
    matchStatus,
    withdrawn,
    withdrawing,
    withdrawTxHash,
    onWithdraw,
    onPlayAgain
}: GameResultCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const confettiRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [confettiParticles, setConfettiParticles] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([])

    // Generate confetti particles for winner
    useEffect(() => {
        if (isWinner && !isDraw) {
            const particles = Array.from({ length: 50 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                color: ['#00f0ff', '#ff0080', '#39ff14', '#ffd700', '#ff6b00'][Math.floor(Math.random() * 5)],
                delay: Math.random() * 2
            }))
            setConfettiParticles(particles)
        }
    }, [isWinner, isDraw])

    // Play sound effect and animate card on mount
    useEffect(() => {
        if (!cardRef.current) return

        const ctx = gsap.context(() => {
            // Card entrance animation
            gsap.from(cardRef.current, {
                scale: 0.8,
                opacity: 0,
                y: 50,
                duration: 0.6,
                ease: "back.out(1.7)"
            })

            // Winner specific animations
            if (isWinner && !isDraw) {
                // Glow pulse
                gsap.to(cardRef.current, {
                    boxShadow: "0 0 60px rgba(57, 255, 20, 0.4)",
                    duration: 1,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut"
                })

                // Confetti animation
                if (confettiRef.current) {
                    const particles = confettiRef.current.querySelectorAll('.confetti-particle')
                    particles.forEach((particle, i) => {
                        gsap.fromTo(particle,
                            { y: -20, opacity: 1, rotation: 0 },
                            {
                                y: 400,
                                opacity: 0,
                                rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
                                duration: 3 + Math.random() * 2,
                                delay: Math.random() * 2,
                                repeat: -1,
                                ease: "none"
                            }
                        )
                    })
                }
            }
        }, cardRef)

        // Play sound effect
        try {
            const soundPath = isWinner && !isDraw
                ? "/sounds/victory.mp3"
                : isDraw
                    ? "/sounds/draw.mp3"
                    : "/sounds/defeat.mp3"

            // Check if sound file exists before playing
            const audio = new Audio(soundPath)
            audio.volume = 0.5
            audioRef.current = audio
            audio.play().catch(() => {
                // Sound file doesn't exist, fail silently
                console.log("Sound file not found, skipping audio")
            })
        } catch {
            // Audio not available
        }

        return () => {
            ctx.revert()
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [isWinner, isDraw])

    const borderClass = isWinner && !isDraw
        ? "border-accent/60"
        : isDraw
            ? "border-warning/50"
            : "border-secondary/40"

    const gifSrc = isWinner && !isDraw
        ? "/gifs/winner.gif"
        : "/gifs/loser.gif"

    return (
        <div className="min-h-screen bg-background py-8 relative overflow-hidden">
            {/* Confetti Container - Winner only */}
            {isWinner && !isDraw && (
                <div ref={confettiRef} className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                    {confettiParticles.map((particle) => (
                        <div
                            key={particle.id}
                            className="confetti-particle absolute w-3 h-3 rounded-sm"
                            style={{
                                left: `${particle.x}%`,
                                top: "-20px",
                                backgroundColor: particle.color,
                                boxShadow: `0 0 6px ${particle.color}`
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="container mx-auto px-4">
                <Card
                    ref={cardRef}
                    className={`max-w-2xl mx-auto p-8 text-center border-2 ${borderClass} bg-card/90 backdrop-blur-sm`}
                >
                    {/* Result Title */}
                    <div className="mb-6">
                        {isWinner && !isDraw ? (
                            <PopArtTitle size="md">Victory!</PopArtTitle>
                        ) : isDraw ? (
                            <h2 className="text-4xl font-bold text-warning">🤝 It's a Draw!</h2>
                        ) : (
                            <h2 className="text-4xl font-bold text-secondary/80">Better Luck Next Time</h2>
                        )}
                    </div>

                    {/* GIF Display */}
                    <div className="relative mx-auto w-56 h-56 mb-6 rounded-xl overflow-hidden border-2 border-border/50">
                        <Image
                            src={gifSrc}
                            alt={isWinner ? "Victory celebration" : "Defeat reaction"}
                            fill
                            className="object-cover"
                            unoptimized // Required for GIFs
                        />
                    </div>

                    {/* Opponent Info */}
                    <p className="text-muted-foreground mb-4">
                        {isWinner && !isDraw
                            ? `Defeated: ${opponentName}`
                            : isDraw
                                ? `Matched with: ${opponentName}`
                                : `Lost to: ${opponentName}`
                        }
                    </p>

                    {/* Winnings/Loss Display */}
                    {isWinner && !isDraw ? (
                        <div className="mb-6 p-4 bg-accent/10 rounded-xl border border-accent/30">
                            <p className="text-3xl font-bold text-accent text-glow-green mb-2">
                                💰 +{winnerPayout} MNT
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Platform Fee (25%): {platformFee} MNT
                            </p>
                        </div>
                    ) : isDraw ? (
                        <div className="mb-6 p-4 bg-warning/10 rounded-xl border border-warning/30">
                            <p className="text-2xl font-bold text-warning">
                                Stake Refunded: {stake} MNT
                            </p>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-secondary/10 rounded-xl border border-secondary/30">
                            <p className="text-2xl font-bold text-secondary/70">
                                -{stake} MNT
                            </p>
                        </div>
                    )}

                    {/* Score Display */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className={`p-3 rounded-lg border ${isWinner || isDraw ? 'border-accent/30 bg-accent/5' : 'border-border'}`}>
                            <p className="text-xs text-muted-foreground uppercase">Your Score</p>
                            <p className={`text-3xl font-bold ${isWinner || isDraw ? 'text-accent' : 'text-foreground'}`}>
                                {myScore}
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg border ${!isWinner && !isDraw ? 'border-secondary/30 bg-secondary/5' : 'border-border'}`}>
                            <p className="text-xs text-muted-foreground uppercase">Opponent</p>
                            <p className={`text-3xl font-bold ${!isWinner && !isDraw ? 'text-secondary' : 'text-foreground'}`}>
                                {opponentScore}
                            </p>
                        </div>
                    </div>

                    {/* Match Info */}
                    <div className="text-xs text-muted-foreground mb-6 space-y-2">
                        <p>Match: <span className="font-mono">{matchId.slice(-8)}</span></p>
                        <Badge variant={matchStatus === 'finished' ? 'neon-green' : 'outline'}>
                            {matchStatus}
                        </Badge>
                        {withdrawTxHash && (
                            <p className="text-accent">
                                Tx: {withdrawTxHash.substring(0, 10)}...{withdrawTxHash.substring(withdrawTxHash.length - 8)}
                            </p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 items-center">
                        {/* Withdraw Button - Winner */}
                        {isWinner && !isDraw && !withdrawn && (
                            <Button
                                onClick={() => onWithdraw(false)}
                                disabled={withdrawing}
                                variant="neon-green"
                                size="lg"
                                className="px-8 shadow-[0_0_20px_rgba(57,255,20,0.4)]"
                            >
                                {withdrawing ? (
                                    <span className="flex items-center gap-2">
                                        <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                                        Confirming...
                                    </span>
                                ) : (
                                    `💎 Withdraw ${winnerPayout} MNT`
                                )}
                            </Button>
                        )}

                        {/* Withdraw Button - Draw */}
                        {isDraw && !withdrawn && (
                            <Button
                                onClick={() => onWithdraw(true)}
                                disabled={withdrawing}
                                variant="neon-cyan"
                                size="lg"
                                className="px-8"
                            >
                                {withdrawing ? 'Confirming...' : `Withdraw Stake (${stake} MNT)`}
                            </Button>
                        )}

                        {/* Already Withdrawn */}
                        {withdrawn && (
                            <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                                <p className="text-accent font-bold text-glow-green">
                                    ✅ Withdrawn {isDraw ? stake : winnerPayout} MNT
                                </p>
                                {withdrawTxHash && (
                                    <a
                                        href={`https://sepolia.arbiscan.io/tx/${withdrawTxHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline mt-2 inline-block"
                                    >
                                        View on Explorer →
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Play Again */}
                        <Button
                            onClick={onPlayAgain}
                            variant="outline"
                            className="mt-2"
                        >
                            🎮 Play Again
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
