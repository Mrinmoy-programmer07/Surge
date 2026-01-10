"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Lock, Zap, Trophy, Star } from "lucide-react"
import gsap from "gsap"

const rewards = [
    {
        id: 1,
        name: "First Win",
        description: "Win your first game",
        icon: Trophy,
        progress: 100,
        reward: "0.01 ETH",
        claimed: true,
    },
    {
        id: 2,
        name: "5 Win Streak",
        description: "Win 5 games in a row",
        icon: Zap,
        progress: 80,
        reward: "0.05 ETH",
        claimed: false,
    },
    {
        id: 3,
        name: "Master Player",
        description: "Reach 75% win rate",
        icon: Star,
        progress: 75,
        reward: "0.1 ETH",
        claimed: false,
    },
    {
        id: 4,
        name: "Game Collector",
        description: "Play all 5 game types",
        icon: Gift,
        progress: 100,
        reward: "0.025 ETH",
        claimed: true,
    },
    {
        id: 5,
        name: "High Roller",
        description: "Win 0.5 ETH",
        icon: Trophy,
        progress: 45,
        reward: "0.2 ETH",
        claimed: false,
    },
    {
        id: 6,
        name: "Legendary Status",
        description: "Reach 100 total wins",
        icon: Lock,
        progress: 24,
        reward: "0.5 ETH",
        claimed: false,
    },
]

export default function RewardsPage() {
    const stampRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // GSAP Stamp Animation
    useEffect(() => {
        if (!stampRef.current) return

        // Preload the audio for instant playback
        const stampAudio = new Audio('/sounds/stamp.mp3')
        stampAudio.volume = 0.6
        stampAudio.load()

        const ctx = gsap.context(() => {
            // Initial state - stamp is above and large
            gsap.set(stampRef.current, {
                scale: 3,
                opacity: 0,
                rotation: -15,
            })

            // Stamp slam animation
            const tl = gsap.timeline({ delay: 0.3 })

            tl.to(stampRef.current, {
                scale: 1,
                opacity: 1,
                duration: 0.4,
                ease: 'power4.in',
                onUpdate: function () {
                    // Play sound when animation is 90% complete (right before impact)
                    if (this.progress() >= 0.9 && !stampAudio.played.length) {
                        stampAudio.play().catch(() => { })
                    }
                }
            })
                .to(stampRef.current, {
                    scale: 1.1,
                    duration: 0.08,
                    ease: 'power2.out'
                })
                .to(stampRef.current, {
                    scale: 1,
                    duration: 0.15,
                    ease: 'elastic.out(1, 0.3)'
                })
                // Add a subtle shake after stamp lands
                .to(containerRef.current, {
                    x: -5,
                    duration: 0.05,
                }, '-=0.2')
                .to(containerRef.current, {
                    x: 5,
                    duration: 0.05,
                })
                .to(containerRef.current, {
                    x: -3,
                    duration: 0.04,
                })
                .to(containerRef.current, {
                    x: 0,
                    duration: 0.04,
                })
        })

        return () => ctx.revert()
    }, [])

    return (
        <div ref={containerRef} className="relative min-h-[80vh]">
            {/* Blurred Content Layer */}
            <div className="blur-[6px] pointer-events-none select-none opacity-60">
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Rewards</h1>
                        <p className="text-muted-foreground mt-2">Complete achievements to earn bonus ETH</p>
                    </div>

                    {/* Rewards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rewards.map((reward) => {
                            const Icon = reward.icon
                            return (
                                <Card
                                    key={reward.id}
                                    className={`${reward.claimed ? "opacity-75 border-accent/30" : "border-primary/20"} transition-all`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-lg ${reward.claimed ? "bg-accent/20" : "bg-primary/20"}`}>
                                                <Icon className={`w-6 h-6 ${reward.claimed ? "text-accent" : "text-primary"}`} />
                                            </div>
                                            {reward.claimed && (
                                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-accent/20 text-accent">
                                                    Claimed
                                                </span>
                                            )}
                                        </div>
                                        <CardTitle className="mt-4">{reward.name}</CardTitle>
                                        <CardDescription>{reward.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-muted-foreground">Progress</span>
                                                <span className="text-sm font-semibold">{reward.progress}%</span>
                                            </div>
                                            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${reward.claimed ? "bg-accent" : "bg-primary"}`}
                                                    style={{ width: `${reward.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-accent">{reward.reward}</span>
                                            <Button
                                                size="sm"
                                                variant={reward.claimed ? "outline" : "default"}
                                                disabled
                                            >
                                                {reward.claimed ? "Claimed" : reward.progress >= 100 ? "Claim" : "Locked"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* COMING SOON Stamp Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                    ref={stampRef}
                    className="relative"
                    style={{ transform: 'rotate(-15deg)' }}
                >
                    {/* Stamp border */}
                    <div className="border-[6px] border-secondary rounded-lg px-12 py-6 bg-black/80 backdrop-blur-sm shadow-[0_0_60px_rgba(255,0,128,0.4)]">
                        {/* Inner decorative border */}
                        <div className="absolute inset-2 border-2 border-secondary/50 rounded pointer-events-none" />

                        {/* Main text */}
                        <div className="text-center">
                            <p className="text-5xl md:text-7xl font-black text-secondary tracking-wider drop-shadow-[0_0_20px_rgba(255,0,128,0.8)]">
                                COMING
                            </p>
                            <p className="text-5xl md:text-7xl font-black text-secondary tracking-wider drop-shadow-[0_0_20px_rgba(255,0,128,0.8)] -mt-2">
                                SOON
                            </p>
                        </div>

                        {/* Decorative lines */}
                        <div className="absolute top-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
                        <div className="absolute bottom-0 left-1/4 w-1/2 h-1 bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />
                    </div>

                    {/* Glow effect behind stamp */}
                    <div className="absolute inset-0 bg-secondary/20 blur-3xl rounded-full scale-150 -z-10" />
                </div>
            </div>
        </div>
    )
}
