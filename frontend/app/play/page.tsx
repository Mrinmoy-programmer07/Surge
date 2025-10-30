"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Clock, Trophy } from "lucide-react"

const games = [
  {
    id: 1,
    name: "Number Memory Battle",
    description: "Remember and repeat number sequences faster than your opponent",
    icon: "🔢",
    players: 1250,
    avgTime: "2 min",
    difficulty: "Medium",
    winRate: "72%",
  },
  {
    id: 2,
    name: "Word Scramble Duel",
    description: "Unscramble words within the time limit to earn points",
    icon: "📝",
    players: 980,
    avgTime: "3 min",
    difficulty: "Easy",
    winRate: "68%",
  },
  {
    id: 3,
    name: "Pattern Predictor",
    description: "Analyze sequences and predict the next number in the pattern",
    icon: "🔗",
    players: 750,
    avgTime: "2.5 min",
    difficulty: "Hard",
    winRate: "65%",
  },
  {
    id: 4,
    name: "Reflex War",
    description: "Test your reaction time in this fast-paced competition",
    icon: "⚡",
    players: 1100,
    avgTime: "1 min",
    difficulty: "Medium",
    winRate: "70%",
  },
  {
    id: 5,
    name: "Memory Match Showdown",
    description: "Find matching pairs faster than your opponent",
    icon: "🎴",
    players: 890,
    avgTime: "2 min",
    difficulty: "Easy",
    winRate: "75%",
  },
]

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<number | null>(null)

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Play Games</h1>
        <p className="text-muted-foreground mt-2">Choose a game and challenge other players to earn cUSD</p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <Card
            key={game.id}
            className={`cursor-pointer transition-all hover:border-primary ${selectedGame === game.id ? "border-primary bg-primary/5" : ""}`}
            onClick={() => setSelectedGame(game.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="text-4xl">{game.icon}</div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-background text-foreground">
                  {game.difficulty}
                </span>
              </div>
              <CardTitle className="mt-4">{game.name}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{game.players} playing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{game.avgTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{game.winRate} win rate</span>
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90">Play Now</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
