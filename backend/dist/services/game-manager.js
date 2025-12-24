"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const game_1 = require("../types/game");
class GameManager {
    constructor(io) {
        this.io = io;
        this.games = new Map();
        this.socketToGame = new Map();
        this.disconnectTimeouts = new Map();
        this.matchmaking = null;
    }
    setMatchmaking(matchmaking) {
        this.matchmaking = matchmaking;
    }
    handleGameReady(socket, data) {
        const { matchId, playerAddress } = data;
        if (!matchId || !playerAddress) {
            socket.emit("error", { message: "Invalid game ready payload" });
            return;
        }
        const game = this.games.get(matchId);
        if (!game) {
            socket.emit("error", { message: "Game not found" });
            return;
        }
        // Clear match acceptance timeout
        if (this.matchmaking) {
            this.matchmaking.clearMatchTimeout(matchId);
        }
        // Mark player as ready
        if (game.player1.address === playerAddress) {
            game.player1.isReady = true;
            game.player1.socketId = socket.id;
        }
        else if (game.player2.address === playerAddress) {
            game.player2.isReady = true;
            game.player2.socketId = socket.id;
        }
        else {
            socket.emit("error", { message: "Player not in this game" });
            return;
        }
        // Track socket to game mapping
        this.socketToGame.set(socket.id, matchId);
        console.log(`✅ Player ${playerAddress} ready for game ${matchId}`);
        // Check if both players are ready
        if (game.player1.isReady && game.player2.isReady) {
            game.status = game_1.GameStatus.IN_PROGRESS;
            game.currentPlayer = game.player1.address;
            game.lastActivity = Date.now();
            game.seq += 1;
            const gameStartMessage = {
                type: "game_start",
                payload: {
                    matchId,
                    gameType: game.gameType,
                    stake: game.stake,
                    player1: game.player1.address,
                    player2: game.player2.address,
                    currentPlayer: game.currentPlayer,
                    gameData: game.gameData,
                    seq: game.seq,
                },
            };
            // Send to both players
            this.emitToPlayer(game.player1.socketId, "game_start", gameStartMessage.payload);
            this.emitToPlayer(game.player2.socketId, "game_start", gameStartMessage.payload);
            console.log(`🚀 Game ${matchId} started! Current player: ${game.currentPlayer} (seq ${game.seq})`);
        }
    }
    handleGameAction(socket, data) {
        const { matchId, playerAddress, action, data: actionData } = data;
        if (!matchId || !action) {
            socket.emit("error", { message: "Invalid game action payload" });
            return;
        }
        const game = this.games.get(matchId);
        if (!game) {
            socket.emit("error", { message: "Game not found" });
            return;
        }
        if (game.status !== game_1.GameStatus.IN_PROGRESS) {
            socket.emit("error", { message: "Game not in progress" });
            return;
        }
        // Verify it's the player's turn
        if (game.currentPlayer !== playerAddress) {
            socket.emit("error", { message: "Not your turn" });
            return;
        }
        // Update last activity
        game.lastActivity = Date.now();
        console.log(`🎯 Game action in ${matchId}: ${action} by ${playerAddress}`);
        // Handle different game actions
        switch (action) {
            case "SUBMIT_TURN":
                this.handleSubmitTurn(game, playerAddress, actionData);
                break;
            case "UPDATE_SCORE":
                this.handleUpdateScore(game, playerAddress, actionData);
                break;
            case "GAME_OVER":
                this.handleGameOver(game, playerAddress, actionData);
                break;
            default:
                socket.emit("error", { message: `Unknown action: ${action}` });
        }
    }
    handleSubmitTurn(game, playerAddress, data) {
        // Switch turns
        game.currentPlayer = game.currentPlayer === game.player1.address ? game.player2.address : game.player1.address;
        game.seq += 1;
        const turnMessage = {
            matchId: game.matchId,
            currentPlayer: game.currentPlayer,
            gameData: data || game.gameData,
            seq: game.seq,
        };
        this.emitToPlayer(game.player1.socketId, "turn_change", turnMessage);
        this.emitToPlayer(game.player2.socketId, "turn_change", turnMessage);
        console.log(`🔄 Turn switched to ${game.currentPlayer} in game ${game.matchId} (seq ${game.seq})`);
    }
    handleUpdateScore(game, playerAddress, data) {
        // Update player score
        if (game.player1.address === playerAddress) {
            game.player1.score = data.score;
        }
        else if (game.player2.address === playerAddress) {
            game.player2.score = data.score;
        }
        game.seq += 1;
        const scoreMessage = {
            matchId: game.matchId,
            player1Score: game.player1.score,
            player2Score: game.player2.score,
            gameData: data.gameData || game.gameData,
            seq: game.seq,
        };
        this.emitToPlayer(game.player1.socketId, "score_update", scoreMessage);
        this.emitToPlayer(game.player2.socketId, "score_update", scoreMessage);
        console.log(`📊 Score updated in game ${game.matchId} (seq ${game.seq}): ${game.player1.score} vs ${game.player2.score}`);
    }
    handleGameOver(game, playerAddress, data) {
        game.status = game_1.GameStatus.FINISHED;
        game.seq += 1;
        const gameOverMessage = {
            matchId: game.matchId,
            winner: data.winner,
            player1Score: game.player1.score,
            player2Score: game.player2.score,
            gameData: data.gameData || game.gameData,
            seq: game.seq,
        };
        this.emitToPlayer(game.player1.socketId, "game_over", gameOverMessage);
        this.emitToPlayer(game.player2.socketId, "game_over", gameOverMessage);
        console.log(`🏁 Game ${game.matchId} finished! Winner: ${data.winner} (seq ${game.seq})`);
        // Clean up socket mappings
        this.socketToGame.delete(game.player1.socketId);
        this.socketToGame.delete(game.player2.socketId);
        // Clean up game after 30 seconds
        setTimeout(() => {
            this.games.delete(game.matchId);
            console.log(`🗑️ Game ${game.matchId} cleaned up`);
        }, 30000);
    }
    handleDisconnect(socket) {
        const matchId = this.socketToGame.get(socket.id);
        if (!matchId)
            return;
        const game = this.games.get(matchId);
        if (!game)
            return;
        // Only handle disconnect for active games
        if (game.status !== game_1.GameStatus.IN_PROGRESS) {
            return;
        }
        const isPlayer1 = game.player1.socketId === socket.id;
        const disconnectedPlayer = isPlayer1 ? game.player1 : game.player2;
        const otherPlayer = isPlayer1 ? game.player2 : game.player1;
        console.log(`⚠️ Player ${disconnectedPlayer.address} disconnected from game ${matchId}`);
        // Pause the game
        game.status = game_1.GameStatus.PAUSED;
        // Notify other player
        this.emitToPlayer(otherPlayer.socketId, "opponent_disconnected", {
            matchId,
            message: "Opponent disconnected. Waiting for reconnection...",
        });
        // Set timeout for reconnection (15 seconds)
        const timeout = setTimeout(() => {
            console.log(`⏰ Reconnection timeout for game ${matchId}`);
            // Auto-forfeit the disconnected player
            game.status = game_1.GameStatus.FINISHED;
            const winner = otherPlayer.address;
            const gameOverMessage = {
                matchId: game.matchId,
                winner,
                reason: "opponent_timeout",
                player1Score: game.player1.score,
                player2Score: game.player2.score,
            };
            this.emitToPlayer(otherPlayer.socketId, "game_over", gameOverMessage);
            console.log(`🏁 Game ${matchId} ended by timeout. Winner: ${winner}`);
            // Clean up
            this.socketToGame.delete(game.player1.socketId);
            this.socketToGame.delete(game.player2.socketId);
            this.disconnectTimeouts.delete(socket.id);
            setTimeout(() => {
                this.games.delete(matchId);
            }, 30000);
        }, 15000);
        this.disconnectTimeouts.set(socket.id, timeout);
    }
    handleReconnect(socket, matchId, playerAddress) {
        const game = this.games.get(matchId);
        if (!game)
            return;
        // Clear disconnect timeout
        const timeout = this.disconnectTimeouts.get(socket.id);
        if (timeout) {
            clearTimeout(timeout);
            this.disconnectTimeouts.delete(socket.id);
        }
        // Update socket ID
        if (game.player1.address === playerAddress) {
            game.player1.socketId = socket.id;
        }
        else if (game.player2.address === playerAddress) {
            game.player2.socketId = socket.id;
        }
        this.socketToGame.set(socket.id, matchId);
        // Resume game if it was paused
        if (game.status === game_1.GameStatus.PAUSED) {
            game.status = game_1.GameStatus.IN_PROGRESS;
            // Notify both players
            const resumeMessage = {
                matchId,
                message: "Game resumed",
                currentPlayer: game.currentPlayer,
                gameData: game.gameData,
            };
            this.emitToPlayer(game.player1.socketId, "game_resumed", resumeMessage);
            this.emitToPlayer(game.player2.socketId, "game_resumed", resumeMessage);
            console.log(`▶️ Game ${matchId} resumed after reconnection`);
        }
    }
    createGame(matchId, gameType, stake, player1Address, player2Address) {
        const game = {
            matchId,
            gameType,
            stake,
            player1: {
                socketId: "",
                address: player1Address,
                score: 0,
                isReady: false,
            },
            player2: {
                socketId: "",
                address: player2Address,
                score: 0,
                isReady: false,
            },
            status: game_1.GameStatus.WAITING_FOR_READY,
            currentPlayer: null,
            gameData: {},
            seq: 0,
            createdAt: Date.now(),
            lastActivity: Date.now(),
        };
        this.games.set(matchId, game);
        console.log(`🎮 Game ${matchId} initialized`);
    }
    emitToPlayer(socketId, event, data) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket?.connected) {
            socket.emit(event, data);
        }
    }
    getGameStats() {
        return {
            total: this.games.size,
            byStatus: {
                waiting: Array.from(this.games.values()).filter((g) => g.status === game_1.GameStatus.WAITING_FOR_READY).length,
                active: Array.from(this.games.values()).filter((g) => g.status === game_1.GameStatus.IN_PROGRESS).length,
                paused: Array.from(this.games.values()).filter((g) => g.status === game_1.GameStatus.PAUSED).length,
                finished: Array.from(this.games.values()).filter((g) => g.status === game_1.GameStatus.FINISHED).length,
            },
        };
    }
}
exports.GameManager = GameManager;
