"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUND_HISTORY_KEY = exports.PLAYER_BETS_PREFIX = exports.PLAYER_BALANCE_PREFIX = exports.GAME_STATE_KEY = void 0;
exports.getGameState = getGameState;
exports.setGameState = setGameState;
exports.getPlayerBalance = getPlayerBalance;
exports.setPlayerBalance = setPlayerBalance;
exports.updatePlayerBalance = updatePlayerBalance;
exports.getPlayerBets = getPlayerBets;
exports.addPlayerBet = addPlayerBet;
exports.addRoundHistory = addRoundHistory;
exports.getRoundHistory = getRoundHistory;
// api/_lib/redis.ts
const redis_1 = require("redis");
// Создаем клиент Redis
const redisClient = (0, redis_1.createClient)({
    url: process.env.KV_URL || 'redis://localhost:6379',
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));
// Подключаемся при старте
redisClient.connect().catch(console.error);
exports.GAME_STATE_KEY = 'game:state';
exports.PLAYER_BALANCE_PREFIX = 'player:balance:';
exports.PLAYER_BETS_PREFIX = 'player:bets:';
exports.ROUND_HISTORY_KEY = 'game:history';
// In-memory хранилище для разработки (пока Redis не настроен)
const memoryStore = new Map();
async function getGameState() {
    try {
        const data = await redisClient.get(exports.GAME_STATE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            memoryStore.set(exports.GAME_STATE_KEY, parsed);
            return parsed;
        }
        return memoryStore.get(exports.GAME_STATE_KEY) || null;
    }
    catch (error) {
        console.warn('Redis unavailable, using memory store');
        return memoryStore.get(exports.GAME_STATE_KEY) || null;
    }
}
async function setGameState(state) {
    try {
        await redisClient.set(exports.GAME_STATE_KEY, JSON.stringify(state));
        memoryStore.set(exports.GAME_STATE_KEY, state);
    }
    catch (error) {
        console.warn('Redis unavailable, saving to memory store');
        memoryStore.set(exports.GAME_STATE_KEY, state);
    }
}
async function getPlayerBalance(userId) {
    try {
        const data = await redisClient.get(`${exports.PLAYER_BALANCE_PREFIX}${userId}`);
        return data ? JSON.parse(data) : { ton: 0, stars: 0 };
    }
    catch (error) {
        console.warn('Redis unavailable, using memory store for balance');
        const key = `${exports.PLAYER_BALANCE_PREFIX}${userId}`;
        return memoryStore.get(key) || { ton: 0, stars: 0 };
    }
}
async function setPlayerBalance(userId, balance) {
    try {
        await redisClient.set(`${exports.PLAYER_BALANCE_PREFIX}${userId}`, JSON.stringify(balance));
        memoryStore.set(`${exports.PLAYER_BALANCE_PREFIX}${userId}`, balance);
    }
    catch (error) {
        console.warn('Redis unavailable, saving to memory store');
        memoryStore.set(`${exports.PLAYER_BALANCE_PREFIX}${userId}`, balance);
    }
}
async function updatePlayerBalance(userId, tonDelta, starsDelta) {
    const current = await getPlayerBalance(userId);
    const newBalance = {
        ton: Math.max(0, current.ton + tonDelta),
        stars: Math.max(0, current.stars + starsDelta)
    };
    await setPlayerBalance(userId, newBalance);
    return newBalance;
}
async function getPlayerBets(userId) {
    try {
        const data = await redisClient.get(`${exports.PLAYER_BETS_PREFIX}${userId}`);
        return data ? JSON.parse(data) : [];
    }
    catch (error) {
        return memoryStore.get(`${exports.PLAYER_BETS_PREFIX}${userId}`) || [];
    }
}
async function addPlayerBet(userId, bet) {
    try {
        const bets = await getPlayerBets(userId);
        bets.push(bet);
        await redisClient.set(`${exports.PLAYER_BETS_PREFIX}${userId}`, JSON.stringify(bets));
        memoryStore.set(`${exports.PLAYER_BETS_PREFIX}${userId}`, bets);
    }
    catch (error) {
        const bets = memoryStore.get(`${exports.PLAYER_BETS_PREFIX}${userId}`) || [];
        bets.push(bet);
        memoryStore.set(`${exports.PLAYER_BETS_PREFIX}${userId}`, bets);
    }
}
async function addRoundHistory(round) {
    try {
        const data = await redisClient.get(exports.ROUND_HISTORY_KEY);
        const history = data ? JSON.parse(data) : [];
        history.unshift(round);
        if (history.length > 50)
            history.pop();
        await redisClient.set(exports.ROUND_HISTORY_KEY, JSON.stringify(history));
        memoryStore.set(exports.ROUND_HISTORY_KEY, history);
    }
    catch (error) {
        const history = memoryStore.get(exports.ROUND_HISTORY_KEY) || [];
        history.unshift(round);
        if (history.length > 50)
            history.pop();
        memoryStore.set(exports.ROUND_HISTORY_KEY, history);
    }
}
async function getRoundHistory(limit = 50) {
    try {
        const data = await redisClient.get(exports.ROUND_HISTORY_KEY);
        const history = data ? JSON.parse(data) : [];
        return history.slice(0, limit);
    }
    catch (error) {
        const history = memoryStore.get(exports.ROUND_HISTORY_KEY) || [];
        return history.slice(0, limit);
    }
}
