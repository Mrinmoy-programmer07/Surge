export type GameType = "number-memory" | "word-scramble" | "pattern" | "reflex" | "memory-match"

export interface Player {
  address: string
  name: string
  score: number
  isReady: boolean
}

export interface GameState {
  id: string
  gameType: GameType
  player1: Player
  player2: Player
  stake: bigint
  status: "waiting" | "starting" | "active" | "finished"
  winner?: string
  startTime?: number
  endTime?: number
  player1Score: number
  player2Score: number
}

export interface NumberMemoryRound {
  sequence: number[]
  playerInputs: {
    player1: number[]
    player2: number[]
  }
  currentRound: number
  maxRounds: number
}
