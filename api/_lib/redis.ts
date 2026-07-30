// api/_lib/redis.ts
import { createClient } from 'redis';

// Создаем клиент Redis
const redisClient = createClient({
  url: process.env.KV_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

// Подключаемся при старте
redisClient.connect().catch(console.error);

export const GAME_STATE_KEY = 'game:state';
export const PLAYER_BALANCE_PREFIX = 'player:balance:';
export const PLAYER_BETS_PREFIX = 'player:bets:';
export const ROUND_HISTORY_KEY = 'game:history';

// In-memory хранилище для разработки (пока Redis не настроен)
const memoryStore = new Map();

export interface Bet {
  amount: number;
  currency: 'ton' | 'stars';
  timestamp: number;
}

export interface Player {
  userId: number;
  username: string;
  firstName: string;
  avatar?: string;
  bets: Bet[];
  totalBet: number;
  currency: 'ton' | 'stars';
  color: string;
}

export interface RoundHistory {
  roundNumber: number;
  roundId: string;
  winner: Player;
  totalPoolTon: number;
  totalPoolStars: number;
  timestamp: number;
}

export interface GameState {
  roundNumber: number;
  roundId: string;
  players: Player[];
  totalPoolTon: number;
  totalPoolStars: number;
  status: 'waiting' | 'active' | 'spinning' | 'finished';
  winner?: Player;
  timeLeft: number;
  lastUpdated: number;
  timerStarted: boolean;
  history: RoundHistory[];
}

export async function getGameState(): Promise<GameState | null> {
  try {
    const data = await redisClient.get(GAME_STATE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      memoryStore.set(GAME_STATE_KEY, parsed);
      return parsed;
    }
    return memoryStore.get(GAME_STATE_KEY) || null;
  } catch (error) {
    console.warn('Redis unavailable, using memory store');
    return memoryStore.get(GAME_STATE_KEY) || null;
  }
}

export async function setGameState(state: GameState): Promise<void> {
  try {
    await redisClient.set(GAME_STATE_KEY, JSON.stringify(state));
    memoryStore.set(GAME_STATE_KEY, state);
  } catch (error) {
    console.warn('Redis unavailable, saving to memory store');
    memoryStore.set(GAME_STATE_KEY, state);
  }
}

export async function getPlayerBalance(userId: number): Promise<{ ton: number; stars: number }> {
  try {
    const data = await redisClient.get(`${PLAYER_BALANCE_PREFIX}${userId}`);
    return data ? JSON.parse(data) : { ton: 0, stars: 0 };
  } catch (error) {
    console.warn('Redis unavailable, using memory store for balance');
    const key = `${PLAYER_BALANCE_PREFIX}${userId}`;
    return memoryStore.get(key) || { ton: 0, stars: 0 };
  }
}

export async function setPlayerBalance(userId: number, balance: { ton: number; stars: number }): Promise<void> {
  try {
    await redisClient.set(`${PLAYER_BALANCE_PREFIX}${userId}`, JSON.stringify(balance));
    memoryStore.set(`${PLAYER_BALANCE_PREFIX}${userId}`, balance);
  } catch (error) {
    console.warn('Redis unavailable, saving to memory store');
    memoryStore.set(`${PLAYER_BALANCE_PREFIX}${userId}`, balance);
  }
}

export async function updatePlayerBalance(
  userId: number, 
  tonDelta: number, 
  starsDelta: number
): Promise<{ ton: number; stars: number }> {
  const current = await getPlayerBalance(userId);
  const newBalance = {
    ton: Math.max(0, current.ton + tonDelta),
    stars: Math.max(0, current.stars + starsDelta)
  };
  await setPlayerBalance(userId, newBalance);
  return newBalance;
}

export async function getPlayerBets(userId: number): Promise<Bet[]> {
  try {
    const data = await redisClient.get(`${PLAYER_BETS_PREFIX}${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return memoryStore.get(`${PLAYER_BETS_PREFIX}${userId}`) || [];
  }
}

export async function addPlayerBet(userId: number, bet: Bet): Promise<void> {
  try {
    const bets = await getPlayerBets(userId);
    bets.push(bet);
    await redisClient.set(`${PLAYER_BETS_PREFIX}${userId}`, JSON.stringify(bets));
    memoryStore.set(`${PLAYER_BETS_PREFIX}${userId}`, bets);
  } catch (error) {
    const bets = memoryStore.get(`${PLAYER_BETS_PREFIX}${userId}`) || [];
    bets.push(bet);
    memoryStore.set(`${PLAYER_BETS_PREFIX}${userId}`, bets);
  }
}

export async function addRoundHistory(round: RoundHistory): Promise<void> {
  try {
    const data = await redisClient.get(ROUND_HISTORY_KEY);
    const history: RoundHistory[] = data ? JSON.parse(data) : [];
    history.unshift(round);
    if (history.length > 50) history.pop();
    await redisClient.set(ROUND_HISTORY_KEY, JSON.stringify(history));
    memoryStore.set(ROUND_HISTORY_KEY, history);
  } catch (error) {
    const history: RoundHistory[] = memoryStore.get(ROUND_HISTORY_KEY) || [];
    history.unshift(round);
    if (history.length > 50) history.pop();
    memoryStore.set(ROUND_HISTORY_KEY, history);
  }
}

export async function getRoundHistory(limit: number = 50): Promise<RoundHistory[]> {
  try {
    const data = await redisClient.get(ROUND_HISTORY_KEY);
    const history: RoundHistory[] = data ? JSON.parse(data) : [];
    return history.slice(0, limit);
  } catch (error) {
    const history: RoundHistory[] = memoryStore.get(ROUND_HISTORY_KEY) || [];
    return history.slice(0, limit);
  }
}