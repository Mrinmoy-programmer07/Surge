import { createServer } from "http";
import { Server, Socket } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
});

// Import game logic modules
import { MatchmakingManager } from "./services/matchmaking";
import { GameManager } from "./services/game-manager";

const matchmaking = new MatchmakingManager(io);
const gameManager = new GameManager(io);

// Wire up bidirectional references
matchmaking.setGameManager(gameManager);
gameManager.setMatchmaking(matchmaking);

io.on("connection", (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Matchmaking events
    socket.on("join_queue", (data) => matchmaking.handleJoinQueue(socket, data));
    socket.on("leave_queue", () => matchmaking.handleLeaveQueue(socket));

    // Game events
    socket.on("game_ready", (data) => gameManager.handleGameReady(socket, data));
    socket.on("game_action", (data) => gameManager.handleGameAction(socket, data));

    // Disconnection handling
    socket.on("disconnect", (reason) => {
        console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
        matchmaking.handleDisconnect(socket);
        gameManager.handleDisconnect(socket);
    });

    // Ping/pong for connection health
    socket.on("ping", () => {
        socket.emit("pong");
    });
});

// Health check endpoint
httpServer.on("request", (req, res) => {
    if (req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                status: "healthy",
                activeQueues: matchmaking.getQueueStats(),
                activeGames: gameManager.getGameStats(),
                timestamp: new Date().toISOString(),
            })
        );
    } else {
        res.writeHead(404);
        res.end("Not found");
    }
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`🚀 Socket.io server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing server...");
    httpServer.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
