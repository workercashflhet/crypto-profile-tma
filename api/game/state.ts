// api/game/state.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  getGameState, 
  setGameState, 
  updatePlayerBalance,
  addPlayerBet,
  addRoundHistory,
  getRoundHistory,
  GameState,
  Player,
  Bet
} from '../_lib/redis';

const ROUND_DURATION = 30;
const PLAYER_COLORS = [
  '#2196F3', '#E91E63', '#00BCD4', '#FF9800', '#4CAF50',
  '#9C27B0', '#FF5722', '#795548', '#607D8B', '#CDDC39'
];

function createNewRound(): GameState {
  return {
    roundNumber: 1,
    roundId: `round_${Date.now()}`,
    players: [],
    totalPoolTon: 0,
    totalPoolStars: 0,
    status: 'waiting',
    timeLeft: ROUND_DURATION,
    lastUpdated: Date.now(),
    timerStarted: false,
    history: []
  };
}

async function getOrCreateGameState(): Promise<GameState> {
  let state = await getGameState();
  if (!state) {
    state = createNewRound();
    await setGameState(state);
  }
  return state;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const state = await getOrCreateGameState();
      return res.status(200).json({
        success: true,
        data: state
      });
    } catch (error) {
      console.error('Error getting game state:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get game state'
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body;
      let state = await getOrCreateGameState();

      switch (action) {
        case 'place_bet': {
          const { userId, username, firstName, avatar, amount, currency } = payload;
          
          if (state.status === 'spinning' || state.status === 'finished') {
            return res.status(400).json({
              success: false,
              error: 'Game is not accepting bets right now'
            });
          }

          if (amount <= 0) {
            return res.status(400).json({
              success: false,
              error: 'Bet amount must be greater than 0'
            });
          }

          const tonDelta = currency === 'ton' ? -amount : 0;
          const starsDelta = currency === 'stars' ? -amount : 0;
          const newBalance = await updatePlayerBalance(userId, tonDelta, starsDelta);

          if (currency === 'ton' && newBalance.ton < 0) {
            return res.status(400).json({
              success: false,
              error: 'Insufficient TON balance'
            });
          }
          if (currency === 'stars' && newBalance.stars < 0) {
            return res.status(400).json({
              success: false,
              error: 'Insufficient Stars balance'
            });
          }

          const bet: Bet = {
            amount,
            currency,
            timestamp: Date.now()
          };

          const existingPlayerIndex = state.players.findIndex(p => p.userId === userId);
          
          if (existingPlayerIndex >= 0) {
            const player = state.players[existingPlayerIndex];
            player.bets.push(bet);
            player.totalBet = player.bets.reduce((sum, b) => sum + b.amount, 0);
            player.currency = currency;
          } else {
            const usedColors = state.players.map(p => p.color);
            const availableColors = PLAYER_COLORS.filter(c => !usedColors.includes(c));
            const color = availableColors.length > 0 
              ? availableColors[Math.floor(Math.random() * availableColors.length)]
              : PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

            const newPlayer: Player = {
              userId,
              username: username || `user_${userId}`,
              firstName,
              avatar,
              bets: [bet],
              totalBet: amount,
              currency,
              color
            };
            state.players.push(newPlayer);
          }

          state.totalPoolTon = state.players.reduce((sum, p) => 
            sum + p.bets.filter(b => b.currency === 'ton').reduce((s, b) => s + b.amount, 0), 0
          );
          state.totalPoolStars = state.players.reduce((sum, p) => 
            sum + p.bets.filter(b => b.currency === 'stars').reduce((s, b) => s + b.amount, 0), 0
          );

          if (state.players.length >= 2 && state.status === 'waiting') {
            state.status = 'active';
            state.timerStarted = true;
          }

          state.lastUpdated = Date.now();
          await setGameState(state);
          await addPlayerBet(userId, bet);

          return res.status(200).json({
            success: true,
            data: state
          });
        }

        case 'spin': {
          if (state.status !== 'active') {
            return res.status(400).json({
              success: false,
              error: 'Cannot spin now'
            });
          }

          if (state.players.length < 2) {
            return res.status(400).json({
              success: false,
              error: 'Not enough players'
            });
          }

          const totalPool = state.totalPoolTon + state.totalPoolStars * 0.013;
          let random = Math.random() * totalPool;
          let winner: Player | undefined;

          for (const player of state.players) {
            const playerValue = player.bets.reduce((sum, b) => {
              return sum + (b.currency === 'ton' ? b.amount : b.amount * 0.013);
            }, 0);
            if (random <= playerValue) {
              winner = player;
              break;
            }
            random -= playerValue;
          }

          if (!winner) {
            winner = state.players[0];
          }

          await updatePlayerBalance(
            winner.userId,
            state.totalPoolTon,
            state.totalPoolStars
          );

          await addRoundHistory({
            roundNumber: state.roundNumber,
            roundId: state.roundId,
            winner,
            totalPoolTon: state.totalPoolTon,
            totalPoolStars: state.totalPoolStars,
            timestamp: Date.now()
          });

          state.status = 'finished';
          state.winner = winner;
          state.lastUpdated = Date.now();
          await setGameState(state);

          return res.status(200).json({
            success: true,
            data: state
          });
        }

        case 'reset': {
          if (state.winner) {
            await addRoundHistory({
              roundNumber: state.roundNumber,
              roundId: state.roundId,
              winner: state.winner,
              totalPoolTon: state.totalPoolTon,
              totalPoolStars: state.totalPoolStars,
              timestamp: Date.now()
            });
          }

          const newState = createNewRound();
          newState.roundNumber = state.roundNumber + 1;
          await setGameState(newState);

          return res.status(200).json({
            success: true,
            data: newState
          });
        }

        case 'get_history': {
          const limit = payload?.limit || 50;
          const history = await getRoundHistory(limit);
          return res.status(200).json({
            success: true,
            history
          });
        }

        default: {
          return res.status(400).json({
            success: false,
            error: 'Unknown action'
          });
        }
      }
    } catch (error) {
      console.error('Error processing action:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}