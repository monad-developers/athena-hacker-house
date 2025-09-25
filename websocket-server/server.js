const WebSocket = require('ws');
const http = require('http');

class GameServer {
  constructor() {
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });
    this.games = new Map(); // gameId -> GameState
    this.connections = new Map(); // ws -> { gameId, role }
    
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Failed to parse message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'join':
        this.handleJoin(ws, message);
        break;
      case 'leave':
        this.handleLeave(ws, message);
        break;
      case 'pour':
        this.handlePour(ws, message);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  handleJoin(ws, message) {
    const { gameId, role } = message;
    
    if (!gameId || !role || !['eth', 'mon'].includes(role)) {
      this.sendError(ws, 'Invalid join parameters');
      return;
    }

    // Initialize game if it doesn't exist
    if (!this.games.has(gameId)) {
      this.games.set(gameId, {
        gameId,
        currentAmount: BigInt(0),
        ethAmount: BigInt(0),
        monAmount: BigInt(0),
        isEthTurn: true,
        isGameOver: false,
        winner: null,
        players: { eth: null, mon: null }
      });
    }

    const game = this.games.get(gameId);
    
    // Check if role is already taken
    if (game.players[role]) {
      this.sendError(ws, `Role ${role} is already taken`);
      return;
    }

    // Assign player to role
    game.players[role] = ws;
    this.connections.set(ws, { gameId, role });
    
    console.log(`Player joined game ${gameId} as ${role}`);
    
    // Send current game state to all players
    this.broadcastGameState(gameId);
  }

  handleLeave(ws, message) {
    const connection = this.connections.get(ws);
    if (connection) {
      const { gameId, role } = connection;
      const game = this.games.get(gameId);
      
      if (game) {
        game.players[role] = null;
        console.log(`Player left game ${gameId} (${role})`);
        
        // If both players left, remove the game
        if (!game.players.eth && !game.players.mon) {
          this.games.delete(gameId);
        } else {
          this.broadcastGameState(gameId);
        }
      }
      
      this.connections.delete(ws);
    }
  }

  handlePour(ws, message) {
    const connection = this.connections.get(ws);
    if (!connection) {
      this.sendError(ws, 'Not in a game');
      return;
    }

    const { gameId, role } = connection;
    const game = this.games.get(gameId);
    
    if (!game || game.isGameOver) {
      this.sendError(ws, 'Game not found or already over');
      return;
    }

    // Check if it's the player's turn
    const isPlayerTurn = (role === 'eth' && game.isEthTurn) || (role === 'mon' && !game.isEthTurn);
    if (!isPlayerTurn) {
      this.sendError(ws, 'Not your turn');
      return;
    }

    const amount = parseFloat(message.amount);
    if (isNaN(amount) || amount <= 0) {
      this.sendError(ws, 'Invalid amount');
      return;
    }

    const pourAmount = BigInt(Math.floor(amount * 1e18));
    const newTotal = game.currentAmount + pourAmount;
    const limit = BigInt(1e18); // 1.0 in wei

    // Check for overflow
    if (newTotal > limit) {
      // Game over - overflow!
      game.isGameOver = true;
      game.winner = role === 'eth' ? 'mon' : 'eth'; // Opposite player wins
      game.currentAmount = limit;
    } else {
      // Normal pour
      game.currentAmount = newTotal;
      
      // Add to appropriate pot
      if (role === 'eth') {
        game.ethAmount += pourAmount;
      } else {
        game.monAmount += pourAmount;
      }
      
      // Check if glass is exactly full
      if (newTotal === limit) {
        game.isGameOver = true;
        game.winner = role; // Current player wins
      } else {
        // Switch turns
        game.isEthTurn = !game.isEthTurn;
      }
    }

    console.log(`Player ${role} poured ${amount} in game ${gameId}`);
    this.broadcastGameState(gameId);
  }

  handleDisconnect(ws) {
    const connection = this.connections.get(ws);
    if (connection) {
      this.handleLeave(ws, { type: 'leave' });
    }
  }

  broadcastGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const message = {
      type: 'gameState',
      gameId,
      gameState: {
        ...game,
        currentAmount: game.currentAmount.toString(),
        ethAmount: game.ethAmount.toString(),
        monAmount: game.monAmount.toString(),
      }
    };

    // Send to both players
    Object.values(game.players).forEach(player => {
      if (player && player.readyState === WebSocket.OPEN) {
        player.send(JSON.stringify(message));
      }
    });
  }

  sendError(ws, error) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'error', error }));
    }
  }

  start(port = 8080) {
    this.server.listen(port, () => {
      console.log(`Game server running on port ${port}`);
    });
  }
}

// Start the server
const gameServer = new GameServer();
gameServer.start();

module.exports = GameServer;
