const WebSocket = require("ws");
const http = require("http");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active matchmaking queues
const matchmakingQueues = new Map();

// Store active games and their state
const activeGames = new Map();

// Helper function to create queue key
const getQueueKey = (gameType, stake) => `${gameType}_${stake}`;

wss.on("connection", (ws) => {
  console.log("✅ New client connected");

  // Set up ping/pong to keep connection alive
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, message);
    } catch (error) {
      console.error("Error parsing message:", error);
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: { message: "Invalid message format" },
        })
      );
    }
  });

  ws.on("close", (code, reason) => {
    console.log("❌ Client disconnected", { code, reason: reason.toString() });
    // Remove player from all queues
    removePlayerFromAllQueues(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket client error:", error);
  });
});

function handleMessage(ws, message) {
  const { type, payload } = message;

  // If the incoming message carries a playerAddress, update any active game's
  // stored websocket reference for that player so that broadcasts go to the
  // socket the client is actively using.
  if (payload && payload.playerAddress) {
    for (const game of activeGames.values()) {
      if (
        game.player1 &&
        game.player1.address === payload.playerAddress &&
        game.player1.ws !== ws
      ) {
        console.log(
          `🔁 Updating ws for player1 ${payload.playerAddress} in game ${game.matchId}`
        );
        game.player1.ws = ws;
      }
      if (
        game.player2 &&
        game.player2.address === payload.playerAddress &&
        game.player2.ws !== ws
      ) {
        console.log(
          `🔁 Updating ws for player2 ${payload.playerAddress} in game ${game.matchId}`
        );
        game.player2.ws = ws;
      }
    }
  }

  if (!type) {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: { message: "Message type is required" },
      })
    );
    return;
  }

  switch (type) {
    case "JOIN_QUEUE":
      if (
        !payload ||
        !payload.playerAddress ||
        !payload.gameType ||
        !payload.stake
      ) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            payload: { message: "Invalid JOIN_QUEUE payload" },
          })
        );
        return;
      }
      handleJoinQueue(ws, payload);
      break;
    case "LEAVE_QUEUE":
      handleLeaveQueue(ws, payload);
      break;
    case "PING":
      ws.send(JSON.stringify({ type: "PONG" }));
      break;
    case "GAME_ACTION":
      if (!payload || !payload.matchId || !payload.action) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            payload: { message: "Invalid GAME_ACTION payload" },
          })
        );
        return;
      }
      handleGameAction(ws, payload);
      break;
    case "GAME_READY":
      if (!payload || !payload.matchId) {
        ws.send(
          JSON.stringify({
            type: "ERROR",
            payload: { message: "Invalid GAME_READY payload" },
          })
        );
        return;
      }
      handleGameReady(ws, payload);
      break;
    default:
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: { message: `Unknown message type: ${type}` },
        })
      );
  }
}

function handleJoinQueue(ws, { playerAddress, gameType, stake }) {
  const queueKey = getQueueKey(gameType, stake);

  if (!matchmakingQueues.has(queueKey)) {
    matchmakingQueues.set(queueKey, []);
  }

  const queue = matchmakingQueues.get(queueKey);

  // Check if player already in queue
  const existingPlayer = queue.find((p) => p.playerAddress === playerAddress);
  if (existingPlayer) {
    existingPlayer.ws = ws;
    console.log(`🔄 Player ${playerAddress} reconnected to ${gameType} queue`);
    return;
  }

  // Add player to queue
  const player = {
    playerAddress,
    gameType,
    stake,
    ws,
    joinedAt: Date.now(),
  };

  queue.push(player);
  console.log(
    `🎮 Player ${playerAddress} joined ${gameType} queue (stake: ${stake})`
  );
  console.log(`📊 Queue ${queueKey} now has ${queue.length} players`);

  // Try to find a match
  tryMatchPlayers(queueKey);
}

function handleLeaveQueue(ws, { playerAddress }) {
  removePlayerFromAllQueues(ws);
}

function removePlayerFromAllQueues(ws) {
  for (const [queueKey, queue] of matchmakingQueues.entries()) {
    const playerIndex = queue.findIndex((p) => p.ws === ws);
    if (playerIndex !== -1) {
      const player = queue[playerIndex];
      console.log(
        `👋 Player ${player.playerAddress} left ${player.gameType} queue`
      );
      queue.splice(playerIndex, 1);

      // Clean up empty queues
      if (queue.length === 0) {
        matchmakingQueues.delete(queueKey);
      }
    }
  }
}

function tryMatchPlayers(queueKey) {
  const queue = matchmakingQueues.get(queueKey);
  if (!queue || queue.length < 2) return;

  // Find two players to match
  const player1 = queue.shift();
  const player2 = queue.shift();

  console.log(
    `🎯 Match found: ${player1.playerAddress} vs ${player2.playerAddress}`
  );

  // Calculate synchronized start time (3 seconds from now)
  const gameStartTime = Date.now() + 3000;

  // Generate matchId server-side
  const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Send match notification to both players
  const matchData = {
    type: "MATCH_FOUND",
    payload: {
      player1: player1.playerAddress,
      player2: player2.playerAddress,
      gameType: player1.gameType,
      stake: player1.stake,
      matchId: matchId,
      gameStartTime: gameStartTime,
    },
  };

  console.log(
    `⏰ Game will start at: ${new Date(gameStartTime).toISOString()}`
  );

  // Send to both players simultaneously
  if (player1.ws.readyState === WebSocket.OPEN) {
    player1.ws.send(JSON.stringify(matchData));
    console.log(`📤 Sent match data to player1: ${player1.playerAddress}`);
  }

  if (player2.ws.readyState === WebSocket.OPEN) {
    player2.ws.send(JSON.stringify(matchData));
    console.log(`📤 Sent match data to player2: ${player2.playerAddress}`);
  }

  // Initialize game state
  const gameState = {
    matchId: matchData.payload.matchId,
    gameType: player1.gameType,
    stake: player1.stake,
    player1: {
      address: player1.playerAddress,
      ws: player1.ws,
      score: 0,
      isReady: false,
      currentTurn: false,
    },
    player2: {
      address: player2.playerAddress,
      ws: player2.ws,
      score: 0,
      isReady: false,
      currentTurn: false,
    },
    status: "waiting_for_ready",
    currentPlayer: null,
    gameData: {},
    seq: 0,
    createdAt: Date.now(),
  };

  activeGames.set(matchData.payload.matchId, gameState);
  console.log(`🎮 Game ${matchData.payload.matchId} initialized`);

  // Clean up empty queue
  if (queue.length === 0) {
    matchmakingQueues.delete(queueKey);
  }
}

function handleGameReady(ws, { matchId, playerAddress }) {
  const game = activeGames.get(matchId);
  if (!game) {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: { message: "Game not found" },
      })
    );
    return;
  }

  // Mark player as ready
  if (game.player1.address === playerAddress) {
    game.player1.isReady = true;
  } else if (game.player2.address === playerAddress) {
    game.player2.isReady = true;
  } else {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: { message: "Player not in this game" },
      })
    );
    return;
  }

  console.log(`✅ Player ${playerAddress} ready for game ${matchId}`);

  // Check if both players are ready
  if (game.player1.isReady && game.player2.isReady) {
    game.status = "in_progress";
    game.currentPlayer = game.player1.address; // Player 1 starts

    // Send game start to both players
    const gameStartMessage = {
      type: "GAME_START",
      payload: {
        matchId,
        gameType: game.gameType,
        stake: game.stake,
        player1: game.player1.address,
        player2: game.player2.address,
        currentPlayer: game.currentPlayer,
        gameData: game.gameData,
      },
    };

    // bump seq and include it in the start message
    game.seq = (game.seq || 0) + 1;
    gameStartMessage.payload.seq = game.seq;

    try {
      if (game.player1.ws.readyState === WebSocket.OPEN)
        game.player1.ws.send(JSON.stringify(gameStartMessage));
    } catch (e) {
      console.error("Send GAME_START to player1 failed", e);
    }
    try {
      if (game.player2.ws.readyState === WebSocket.OPEN)
        game.player2.ws.send(JSON.stringify(gameStartMessage));
    } catch (e) {
      console.error("Send GAME_START to player2 failed", e);
    }

    console.log(
      `🚀 Game ${matchId} started! Current player: ${game.currentPlayer} (seq ${game.seq})`
    );

    console.log(
      `🚀 Game ${matchId} started! Current player: ${game.currentPlayer}`
    );
  }
}

function handleGameAction(ws, { matchId, playerAddress, action, data }) {
  const game = activeGames.get(matchId);
  if (!game) {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: { message: "Game not found" },
      })
    );
    return;
  }

  if (game.status !== "in_progress") {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: { message: "Game not in progress" },
      })
    );
    return;
  }

  // Verify it's the player's turn
  if (game.currentPlayer !== playerAddress) {
    ws.send(
      JSON.stringify({
        type: "ERROR",
        payload: { message: "Not your turn" },
      })
    );
    return;
  }

  console.log(`🎯 Game action in ${matchId}: ${action} by ${playerAddress}`);

  // Handle different game actions
  switch (action) {
    case "SUBMIT_TURN":
      handleSubmitTurn(game, playerAddress, data);
      break;
    case "UPDATE_SCORE":
      handleUpdateScore(game, playerAddress, data);
      break;
    case "GAME_OVER":
      handleGameOver(game, playerAddress, data);
      break;
    default:
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: { message: `Unknown action: ${action}` },
        })
      );
  }
}

function handleSubmitTurn(game, playerAddress, data) {
  // Switch turns
  game.currentPlayer =
    game.currentPlayer === game.player1.address
      ? game.player2.address
      : game.player1.address;

  // Broadcast turn change to both players
  const turnMessage = {
    type: "TURN_CHANGE",
    payload: {
      matchId: game.matchId,
      currentPlayer: game.currentPlayer,
      gameData: data || game.gameData,
    },
  };

  // bump seq and include it
  game.seq = (game.seq || 0) + 1;
  turnMessage.payload.seq = game.seq;

  try {
    if (game.player1.ws.readyState === WebSocket.OPEN)
      game.player1.ws.send(JSON.stringify(turnMessage));
  } catch (e) {
    console.error("Send turn to player1 failed", e);
  }
  try {
    if (game.player2.ws.readyState === WebSocket.OPEN)
      game.player2.ws.send(JSON.stringify(turnMessage));
  } catch (e) {
    console.error("Send turn to player2 failed", e);
  }

  console.log(
    `🔄 Turn switched to ${game.currentPlayer} in game ${game.matchId} (seq ${game.seq})`
  );
}

function handleUpdateScore(game, playerAddress, data) {
  // Update player score
  if (game.player1.address === playerAddress) {
    game.player1.score = data.score;
  } else if (game.player2.address === playerAddress) {
    game.player2.score = data.score;
  }

  // Broadcast score update to both players
  const scoreMessage = {
    type: "SCORE_UPDATE",
    payload: {
      matchId: game.matchId,
      player1Score: game.player1.score,
      player2Score: game.player2.score,
      gameData: data.gameData || game.gameData,
    },
  };

  // bump seq and include it
  game.seq = (game.seq || 0) + 1;
  scoreMessage.payload.seq = game.seq;

  try {
    if (game.player1.ws.readyState === WebSocket.OPEN)
      game.player1.ws.send(JSON.stringify(scoreMessage));
  } catch (e) {
    console.error("Send score to player1 failed", e);
  }
  try {
    if (game.player2.ws.readyState === WebSocket.OPEN)
      game.player2.ws.send(JSON.stringify(scoreMessage));
  } catch (e) {
    console.error("Send score to player2 failed", e);
  }

  console.log(
    `📊 Score updated in game ${game.matchId} (seq ${game.seq}): ${game.player1.score} vs ${game.player2.score}`
  );
}

function handleGameOver(game, playerAddress, data) {
  game.status = "finished";
  game.winner = data.winner;
  game.endTime = Date.now();

  // Broadcast game over to both players
  const gameOverMessage = {
    type: "GAME_OVER",
    payload: {
      matchId: game.matchId,
      winner: data.winner,
      player1Score: game.player1.score,
      player2Score: game.player2.score,
      gameData: data.gameData || game.gameData,
    },
  };

  // bump seq and include it
  game.seq = (game.seq || 0) + 1;
  gameOverMessage.payload.seq = game.seq;

  // Send to both players if they're still connected
  try {
    if (game.player1.ws.readyState === WebSocket.OPEN)
      game.player1.ws.send(JSON.stringify(gameOverMessage));
  } catch (e) {
    console.error("Send gameOver to player1 failed", e);
  }
  try {
    if (game.player2.ws.readyState === WebSocket.OPEN)
      game.player2.ws.send(JSON.stringify(gameOverMessage));
  } catch (e) {
    console.error("Send gameOver to player2 failed", e);
  }

  console.log(
    `🏁 Game ${game.matchId} finished! Winner: ${data.winner} (seq ${game.seq})`
  );

  // Clean up game after 30 seconds
  setTimeout(() => {
    activeGames.delete(game.matchId);
    console.log(`🗑️ Game ${game.matchId} cleaned up`);
  }, 30000);
}

// Health check endpoint
server.on("request", (req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "healthy",
        activeQueues: matchmakingQueues.size,
        totalPlayers: Array.from(matchmakingQueues.values()).reduce(
          (sum, queue) => sum + queue.length,
          0
        ),
        activeGames: activeGames.size,
        games: Array.from(activeGames.values()).map((game) => ({
          matchId: game.matchId,
          gameType: game.gameType,
          status: game.status,
          player1: game.player1.address,
          player2: game.player2.address,
          currentPlayer: game.currentPlayer,
        })),
      })
    );
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Ping all clients every 30 seconds to keep connections alive
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("💀 Terminating dead connection");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
