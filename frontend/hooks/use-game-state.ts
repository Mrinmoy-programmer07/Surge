"use client"

import { useGameState } from "@/lib/game-state-context"

export function useGameStateHook() {
  return useGameState()
}
