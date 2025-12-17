export interface Player {
    socketId: string;
    address: string;
    score: number;
    isReady: boolean;
}

export interface GameState {
    matchId: string;
    gameType: string;
    stake: string;
    player1: Player;
    player2: Player;
    status: GameStatus;
    currentPlayer: string | null;
    gameData: Record<string, any>;
    seq: number;
    createdAt: number;
    lastActivity: number;
}

export enum GameStatus {
    WAITING_FOR_READY = "waiting_for_ready",
    IN_PROGRESS = "in_progress",
    PAUSED = "paused",
    FINISHED = "finished",
    CANCELLED = "cancelled",
}

export enum QueueStatus {
    WAITING = "WAITING",
    MATCHED = "MATCHED",
    CANCELLED = "CANCELLED",
}

export interface QueuePlayer {
    socketId: string;
    playerAddress: string;
    gameType: string;
    stake: string;
    txSignature: string; // Solana deposit tx proof
    status: QueueStatus;
    joinedAt: number;
}

export interface MatchFoundPayload {
    player1: string;
    player2: string;
    gameType: string;
    stake: string;
    matchId: string;
    gameStartTime: number;
}
