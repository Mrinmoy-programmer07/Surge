"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchmakingManager = void 0;
const game_1 = require("../types/game");
class MatchmakingManager {
    constructor(io) {
        this.io = io;
        this.queues = new Map();
        this.socketToQueue = new Map();
        this.matchAcceptanceTimeouts = new Map();
        this.disconnectTimeouts = new Map();
        this.pendingRefunds = [];
        this.gameManager = null;
    }
    setGameManager(gameManager) {
        this.gameManager = gameManager;
    }
    getQueueKey(gameType, stake) {
        return `${gameType}_${stake}`;
    }
    // New: Require txSignature for pay-before-queue
    handleJoinQueue(socket, data) {
        const { playerAddress, gameType, stake, txSignature } = data;
        if (!playerAddress || !gameType || !stake || !txSignature) {
            socket.emit("error", { message: "Missing required fields (must include txSignature)" });
            return;
        }
        const queueKey = this.getQueueKey(gameType, stake);
        // Remove player from any existing queue (no refund here, they're re-joining)
        this.removePlayerFromQueue(socket.id, false);
        // Get or create queue
        if (!this.queues.has(queueKey)) {
            this.queues.set(queueKey, []);
        }
        const queue = this.queues.get(queueKey);
        // Check if player already in this queue
        const existingIndex = queue.findIndex((p) => p.playerAddress === playerAddress);
        if (existingIndex !== -1) {
            // Update socket ID for reconnection
            queue[existingIndex].socketId = socket.id;
            // Clear any disconnect timeout
            this.clearDisconnectTimeout(socket.id);
            console.log(`🔄 Player ${playerAddress} reconnected to ${gameType} queue`);
            socket.emit("queue_rejoined", { queueKey, position: existingIndex + 1 });
            return;
        }
        // Add player to queue
        const player = {
            socketId: socket.id,
            playerAddress,
            gameType,
            stake,
            txSignature,
            status: game_1.QueueStatus.WAITING,
            joinedAt: Date.now(),
        };
        queue.push(player);
        this.socketToQueue.set(socket.id, queueKey);
        console.log(`🎮 Player ${playerAddress} joined ${gameType} queue (stake: ${stake}, tx: ${txSignature.slice(0, 8)}...)`);
        console.log(`📊 Queue ${queueKey} now has ${queue.length} players`);
        // Notify player they're in queue
        socket.emit("queue_joined", { queueKey, position: queue.length, status: game_1.QueueStatus.WAITING });
        // Try to match players
        this.tryMatchPlayers(queueKey);
    }
    // Cancel and trigger refund
    handleLeaveQueue(socket) {
        this.removePlayerFromQueue(socket.id, true);
    }
    removePlayerFromQueue(socketId, triggerRefund) {
        const queueKey = this.socketToQueue.get(socketId);
        if (!queueKey)
            return;
        const queue = this.queues.get(queueKey);
        if (!queue)
            return;
        const playerIndex = queue.findIndex((p) => p.socketId === socketId);
        if (playerIndex !== -1) {
            const player = queue[playerIndex];
            // Only refund if player is still WAITING (not matched)
            if (triggerRefund && player.status === game_1.QueueStatus.WAITING) {
                player.status = game_1.QueueStatus.CANCELLED;
                this.requestRefund(player);
            }
            console.log(`👋 Player ${player.playerAddress} left ${player.gameType} queue (refund: ${triggerRefund})`);
            queue.splice(playerIndex, 1);
            // Clean up
            this.socketToQueue.delete(socketId);
            this.clearDisconnectTimeout(socketId);
            if (queue.length === 0) {
                this.queues.delete(queueKey);
            }
        }
    }
    // Handle disconnect with 30s refund grace period
    handleDisconnect(socket) {
        const queueKey = this.socketToQueue.get(socket.id);
        if (!queueKey)
            return;
        const queue = this.queues.get(queueKey);
        const player = queue?.find((p) => p.socketId === socket.id);
        if (!player || player.status !== game_1.QueueStatus.WAITING) {
            return;
        }
        console.log(`⚠️ Player ${player.playerAddress} disconnected, starting 30s refund timer`);
        // Start 30s disconnect timeout for refund
        const timeout = setTimeout(() => {
            console.log(`⏰ 30s timeout - auto-refunding ${player.playerAddress}`);
            this.removePlayerFromQueue(socket.id, true);
            this.disconnectTimeouts.delete(socket.id);
        }, 30000);
        this.disconnectTimeouts.set(socket.id, timeout);
    }
    clearDisconnectTimeout(socketId) {
        const timeout = this.disconnectTimeouts.get(socketId);
        if (timeout) {
            clearTimeout(timeout);
            this.disconnectTimeouts.delete(socketId);
        }
    }
    // Queue refund request (to be processed by Solana service)
    requestRefund(player) {
        const refundRequest = {
            playerAddress: player.playerAddress,
            txSignature: player.txSignature,
            stake: player.stake,
        };
        this.pendingRefunds.push(refundRequest);
        console.log(`💰 Refund queued for ${player.playerAddress} (${player.stake})`);
        // Emit event for Solana service to process
        this.io.emit("refund_requested", refundRequest);
    }
    // Get pending refunds for Solana service
    getPendingRefunds() {
        return [...this.pendingRefunds];
    }
    // Mark refund as processed
    refundProcessed(txSignature) {
        this.pendingRefunds = this.pendingRefunds.filter((r) => r.txSignature !== txSignature);
        console.log(`✅ Refund processed for tx: ${txSignature.slice(0, 8)}...`);
    }
    async tryMatchPlayers(queueKey) {
        const queue = this.queues.get(queueKey);
        if (!queue || queue.length < 2)
            return;
        // Only match WAITING players
        const waitingPlayers = queue.filter((p) => p.status === game_1.QueueStatus.WAITING);
        if (waitingPlayers.length < 2)
            return;
        // Match first two waiting players
        const player1 = waitingPlayers[0];
        const player2 = waitingPlayers[1];
        // Mark as matched (no more refunds allowed)
        player1.status = game_1.QueueStatus.MATCHED;
        player2.status = game_1.QueueStatus.MATCHED;
        console.log(`🎯 Match found: ${player1.playerAddress} vs ${player2.playerAddress}`);
        console.log(`🔒 Stakes locked - no refunds allowed`);
        // Generate match ID
        const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const gameStartTime = Date.now() + 3000;
        const matchData = {
            player1: player1.playerAddress,
            player2: player2.playerAddress,
            gameType: player1.gameType,
            stake: player1.stake,
            matchId,
            gameStartTime,
        };
        // Call smart contract to create match from deposits
        try {
            const { contractService } = await Promise.resolve().then(() => __importStar(require('./contract')));
            await contractService.createMatchFromDeposits(matchId, player1.txSignature, player2.txSignature);
            console.log(`✅ Match created on-chain: ${matchId}`);
        }
        catch (error) {
            console.error(`❌ Failed to create match on-chain:`, error.message);
            // Continue anyway - match can still be played
        }
        // Send match notification to both players
        const socket1 = this.io.sockets.sockets.get(player1.socketId);
        const socket2 = this.io.sockets.sockets.get(player2.socketId);
        if (socket1?.connected) {
            socket1.emit("match_found", matchData);
            console.log(`📤 Sent match data to player1: ${player1.playerAddress}`);
        }
        else {
            console.warn(`⚠️ Player1 socket not connected: ${player1.socketId}`);
            player1.status = game_1.QueueStatus.WAITING;
            player2.status = game_1.QueueStatus.WAITING;
            return;
        }
        if (socket2?.connected) {
            socket2.emit("match_found", matchData);
            console.log(`📤 Sent match data to player2: ${player2.playerAddress}`);
        }
        else {
            console.warn(`⚠️ Player2 socket not connected: ${player2.socketId}`);
            player1.status = game_1.QueueStatus.WAITING;
            player2.status = game_1.QueueStatus.WAITING;
            return;
        }
        // Remove matched players from queue
        const idx1 = queue.indexOf(player1);
        const idx2 = queue.indexOf(player2);
        if (idx1 > idx2) {
            queue.splice(idx1, 1);
            queue.splice(idx2, 1);
        }
        else {
            queue.splice(idx2, 1);
            queue.splice(idx1, 1);
        }
        // Clean up queue tracking
        this.socketToQueue.delete(player1.socketId);
        this.socketToQueue.delete(player2.socketId);
        // Create game state
        if (this.gameManager) {
            this.gameManager.createGame(matchId, player1.gameType, player1.stake, player1.playerAddress, player2.playerAddress);
        }
        // Set timeout for match acceptance (10 seconds)
        const timeout = setTimeout(() => {
            console.warn(`⏰ Match ${matchId} acceptance timeout`);
            this.matchAcceptanceTimeouts.delete(matchId);
        }, 10000);
        this.matchAcceptanceTimeouts.set(matchId, timeout);
        // Clean up empty queue
        if (queue.length === 0) {
            this.queues.delete(queueKey);
        }
    }
    clearMatchTimeout(matchId) {
        const timeout = this.matchAcceptanceTimeouts.get(matchId);
        if (timeout) {
            clearTimeout(timeout);
            this.matchAcceptanceTimeouts.delete(matchId);
        }
    }
    getQueueStats() {
        const stats = {};
        this.queues.forEach((queue, key) => {
            stats[key] = {
                total: queue.length,
                waiting: queue.filter((p) => p.status === game_1.QueueStatus.WAITING).length,
                matched: queue.filter((p) => p.status === game_1.QueueStatus.MATCHED).length,
            };
        });
        return stats;
    }
}
exports.MatchmakingManager = MatchmakingManager;
