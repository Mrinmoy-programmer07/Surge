"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { GameType } from "@/lib/game-types"
import { ArrowLeft, Wallet, Swords } from "lucide-react"
import PopArtTitle from "@/components/ui/pop-art-title"

interface StakeSelectorProps {
  game: GameType
  onConfirm: (stake: string) => void
  onBack: () => void
}

const PRESET_STAKES = ["0.0001", "0.0005", "0.001", "0.005"]

export default function StakeSelector({ game, onConfirm, onBack }: StakeSelectorProps) {
  const [customStake, setCustomStake] = useState<string>("")
  const [selectedStake, setSelectedStake] = useState<string>("0.0001")

  const handleConfirm = () => {
    const stake = customStake || selectedStake
    onConfirm(stake)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-300">
      <Card className="w-full max-w-lg p-0 border border-primary/30 bg-black/60 backdrop-blur-xl overflow-hidden relative">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />

        {/* Header Section */}
        <div className="p-6 pb-2 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="absolute left-6 top-6 h-8 w-8 hover:bg-primary/20 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="text-center pt-2">
            <PopArtTitle size="sm" className="mb-2">STAKE AMOUNT</PopArtTitle>
            <p className="text-sm text-muted-foreground">Select your wager to enter the arena</p>
          </div>
        </div>

        <div className="p-8 pt-4 space-y-8">
          {/* Preset Stakes Grid */}
          <div className="grid grid-cols-2 gap-4">
            {PRESET_STAKES.map((stake) => {
              const isSelected = selectedStake === stake && !customStake
              return (
                <button
                  key={stake}
                  onClick={() => {
                    setSelectedStake(stake)
                    setCustomStake("")
                  }}
                  className={`
                    relative group flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
                    ${isSelected
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,240,255,0.3)] scale-[1.02]"
                      : "border-border/50 bg-card/50 hover:border-primary/50 hover:bg-primary/5"
                    }
                  `}
                >
                  <span className={`text-2xl font-black tracking-wider font-mono ${isSelected ? 'text-primary text-glow-cyan' : 'text-foreground/80'}`}>
                    {stake}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">ETH</span>

                  {/* Corner accents for selected state */}
                  {isSelected && (
                    <>
                      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary" />
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Custom Input */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Wallet className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="number"
              placeholder="Or enter custom amount..."
              value={customStake}
              onChange={(e) => {
                setCustomStake(e.target.value)
                if (e.target.value) setSelectedStake("")
              }}
              className="pl-10 h-12 bg-card/50 border-input transition-all focus:border-primary focus:ring-1 focus:ring-primary/50"
            />
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <span className="text-xs font-bold text-muted-foreground">ETH</span>
            </div>
          </div>

          {/* Potential Winnings Display */}
          {(customStake || selectedStake) && (() => {
            const stakeAmount = parseFloat(customStake || selectedStake) || 0
            const totalPot = stakeAmount * 2
            const potentialWin = totalPot * 0.75

            return (
              <div className="bg-gradient-to-r from-accent/10 to-transparent p-4 rounded-xl border-l-4 border-accent mb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                      Potential Winnings
                    </p>
                    <p className="text-2xl font-black text-accent text-glow-green leading-none">
                      +{potentialWin.toFixed(5)} ETH
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Total Pot</p>
                    <p className="text-sm font-mono text-foreground/80">{totalPot.toFixed(5)} ETH</p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            className="w-full h-14 text-lg font-bold tracking-wider relative overflow-hidden group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0"
          >
            <div className="absolute inset-0 bg-[url('/grid-pattern.png')] opacity-20" />
            <div className="flex items-center gap-3 relative z-10">
              <Swords className="h-5 w-5 animate-pulse" />
              <span>ENTER BATTLE</span>
            </div>
          </Button>

          <div className="text-center">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
              Platform Fee: 25% of Total Pot
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

