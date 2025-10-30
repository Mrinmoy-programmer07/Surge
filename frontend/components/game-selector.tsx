"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { GameType } from "@/lib/game-types"

interface GameSelectorProps {
  onSelectGame: (game: GameType) => void
}

const GAMES = [
  {
    id: "number-memory" as GameType,
    name: "Number Memory Battle",
    description: "Remember and repeat the number sequence faster than your opponent",
    icon: "🔢",
    difficulty: "Medium",
  },
  {
    id: "word-scramble" as GameType,
    name: "Word Scramble Duel",
    description: "Unscramble words faster than your opponent",
    icon: "🔤",
    difficulty: "Medium",
  },
  {
    id: "pattern" as GameType,
    name: "Pattern Predictor",
    description: "Predict the next pattern in the sequence",
    icon: "🎯",
    difficulty: "Hard",
  },
  {
    id: "reflex" as GameType,
    name: "Reflex War",
    description: "Test your reaction time against your opponent",
    icon: "⚡",
    difficulty: "Easy",
  },
  {
    id: "memory-match" as GameType,
    name: "Memory Match Showdown",
    description: "Match pairs faster than your opponent",
    icon: "🧠",
    difficulty: "Medium",
  },
]

export default function GameSelector({ onSelectGame }: GameSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {GAMES.map((game) => (
        <Card
          key={game.id}
          className="p-6 border-border hover:border-primary/50 transition-all cursor-pointer group"
          onClick={() => onSelectGame(game.id)}
        >
          <div className="text-4xl mb-4">{game.icon}</div>
          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
            {game.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">{game.difficulty}</span>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onSelectGame(game.id)
              }}
            >
              Play
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
