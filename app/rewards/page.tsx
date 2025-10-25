"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gift, Lock, Zap, Trophy, Star } from "lucide-react"

const rewards = [
  {
    id: 1,
    name: "First Win",
    description: "Win your first game",
    icon: Trophy,
    progress: 100,
    reward: "50 cUSD",
    claimed: true,
  },
  {
    id: 2,
    name: "5 Win Streak",
    description: "Win 5 games in a row",
    icon: Zap,
    progress: 80,
    reward: "200 cUSD",
    claimed: false,
  },
  {
    id: 3,
    name: "Master Player",
    description: "Reach 75% win rate",
    icon: Star,
    progress: 75,
    reward: "500 cUSD",
    claimed: false,
  },
  {
    id: 4,
    name: "Game Collector",
    description: "Play all 5 game types",
    icon: Gift,
    progress: 100,
    reward: "150 cUSD",
    claimed: true,
  },
  {
    id: 5,
    name: "High Roller",
    description: "Win 1000 cUSD",
    icon: Trophy,
    progress: 45,
    reward: "1000 cUSD",
    claimed: false,
  },
  {
    id: 6,
    name: "Legendary Status",
    description: "Reach 100 total wins",
    icon: Lock,
    progress: 24,
    reward: "2000 cUSD",
    claimed: false,
  },
]

export default function RewardsPage() {
  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Rewards</h1>
        <p className="text-muted-foreground mt-2">Complete achievements to earn bonus cUSD</p>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const Icon = reward.icon
          return (
            <Card key={reward.id} className={`${reward.claimed ? "opacity-75" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className={`w-8 h-8 ${reward.claimed ? "text-muted-foreground" : "text-primary"}`} />
                  {reward.claimed && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
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
                  <div className="w-full bg-background rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${reward.progress}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-accent">{reward.reward}</span>
                  <Button size="sm" variant={reward.claimed ? "outline" : "default"} disabled={reward.claimed}>
                    {reward.claimed ? "Claimed" : "Claim"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
