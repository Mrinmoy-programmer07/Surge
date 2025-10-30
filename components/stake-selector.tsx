"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { GameType } from "@/lib/game-types"

interface StakeSelectorProps {
  game: GameType
  onConfirm: (stake: string) => void
  onBack: () => void
}

const PRESET_STAKES = ["0.5", "1", "5", "10"]

export default function StakeSelector({ game, onConfirm, onBack }: StakeSelectorProps) {
  const [customStake, setCustomStake] = useState<string>("")
  const [selectedStake, setSelectedStake] = useState<string>("1")

  const handleConfirm = () => {
    const stake = customStake || selectedStake
    onConfirm(stake)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md p-8 border-border">
        <h2 className="text-2xl font-bold mb-2 text-foreground">Set Your Stake</h2>
        <p className="text-muted-foreground mb-6">Choose how much cUSD you want to wager</p>

        {/* Preset Stakes */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {PRESET_STAKES.map((stake) => (
            <Button
              key={stake}
              variant={selectedStake === stake && !customStake ? "default" : "outline"}
              onClick={() => {
                setSelectedStake(stake)
                setCustomStake("")
              }}
              className={
                selectedStake === stake && !customStake ? "bg-primary text-primary-foreground" : "border-border"
              }
            >
              {stake} cUSD
            </Button>
          ))}
        </div>

        {/* Custom Stake */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">Custom Amount</label>
          <Input
            type="number"
            placeholder="Enter custom amount"
            value={customStake}
            onChange={(e) => {
              setCustomStake(e.target.value)
              if (e.target.value) setSelectedStake("")
            }}
            className="bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 border-border hover:bg-card bg-transparent">
            Back
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
            Confirm Stake
          </Button>
        </div>
      </Card>
    </div>
  )
}
