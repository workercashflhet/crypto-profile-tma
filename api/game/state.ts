// api/game/state.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Путь к файлу с данными
const DATA_PATH = '/tmp/game_data.json';

interface GameData {
  roundNumber: number;
  roundId: string;
  players: Player[];
  totalPoolTon: number;
  totalPoolStars: number;
  status: 'waiting' | 'active' | 'spinning' | 'finished';
  winner?: Player;
  timeLeft: number;
  lastUpdated: number;
  history: RoundHistory[];
}

interface Player {
  userId: number;
  username: string;
  firstName: string;
  avatar?: string;
  bets: Bet[];
  totalBet: number;
  currency: 'ton' | 'stars';
  color: string;
}

interface Bet {
  amount: number;
  currency: 'ton' | 'stars';
  timestamp: number;
}

interface RoundHistory {
  roundNumber: number;
  roundId: string;
  winner: Player;
  totalPoolTon: number;
  totalPoolStars: number;
  timestamp: number;
}

// Инициализация данных
function getDefaultGameData(): GameData {
  return {
    roundNumber: 1,
    roundId: `round_${Date.now()}`,
    players: [],
    totalPoolTon: 0,
    totalPoolStars: 0,
    status: 'waiting',
    timeLeft: 30,
    lastUpdated: Date.now(),
    history: [],
  };
}

// Чтение данных
function readGameData(): GameData {
  try {
    const fs = require('fs');
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading game data:', error);
  }
  return getDefaultGameData();
}

// Запись данных
function writeGameData(data: GameData): void {
  try {
    const fs = require('fs');
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing game data:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const data = readGameData();
      return res.status(200).json({
        success: true,
        data: {
          ...data,
          // Не отправляем историю полностью, только последние 10 записей
          history: data.history.slice(-10),
        },
      });
    } catch (error) {
      console.error('Error in GET:', error);
      return res.status(500).json({ error: 'Failed to get game state' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body;
      const data = readGameData();

      switch (action) {
        case 'place_bet': {
          const { userId, username, firstName, avatar, amount, currency } = payload;
          
          // Проверяем, есть ли игрок
          let player = data.players.find(p => p.userId === userId);
          
          if (player) {
            // Добавляем ставку
            player.bets.push({ amount, currency, timestamp: Date.now() });
            player.totalBet += amount;
          } else {
            // Новый игрок
            const colors = ['#2196F3', '#E91E63', '#00BCD4', '#FF9800', '#4CAF50', '#9C27B0', '#FF5722', '#795548'];
            const usedColors = data.players.map(p => p.color);
            const availableColors = colors.filter(c => !usedColors.includes(c));
            const color = availableColors.length > 0 ? availableColors[0] : colors[Math.floor(Math.random() * colors.length)];
            
            player = {
              userId,
              username,
              firstName,
              avatar,
              bets: [{ amount, currency, timestamp: Date.now() }],
              totalBet: amount,
              currency,
              color,
            };
            data.players.push(player);
          }

          // Обновляем пул
          if (currency === 'ton') {
            data.totalPoolTon += amount;
          } else {
            data.totalPoolStars += amount;
          }

          // Если игроков больше 0 и статус waiting, меняем на active
          if (data.players.length > 0 && data.status === 'waiting') {
            data.status = 'active';
          }

          data.lastUpdated = Date.now();
          writeGameData(data);

          return res.status(200).json({ success: true, data });
        }

        case 'spin': {
          if (data.players.length === 0) {
            return res.status(400).json({ error: 'No players in game' });
          }

          data.status = 'spinning';
          data.lastUpdated = Date.now();
          writeGameData(data);

          // Определяем победителя
          const totalUsd = data.totalPoolTon * 2.5 + data.totalPoolStars * 0.013;
          let random = Math.random() * totalUsd;
          let winner = data.players[0];

          for (const player of data.players) {
            const playerUsd = player.bets
              .filter(b => b.currency === 'ton')
              .reduce((sum, b) => sum + b.amount * 2.5, 0) +
              player.bets
              .filter(b => b.currency === 'stars')
              .reduce((sum, b) => sum + b.amount * 0.013, 0);
            
            random -= playerUsd;
            if (random <= 0) {
              winner = player;
              break;
            }
          }

          // Сохраняем победителя
          data.winner = winner;
          data.status = 'finished';
          data.lastUpdated = Date.now();

          // Добавляем в историю
          data.history.push({
            roundNumber: data.roundNumber,
            roundId: data.roundId,
            winner: winner,
            totalPoolTon: data.totalPoolTon,
            totalPoolStars: data.totalPoolStars,
            timestamp: Date.now(),
          });

          // Увеличиваем номер раунда
          data.roundNumber += 1;
          data.roundId = `round_${Date.now()}`;
          
          writeGameData(data);

          return res.status(200).json({ success: true, data });
        }

        case 'reset': {
          // Сбрасываем игру для нового раунда
          data.players = [];
          data.totalPoolTon = 0;
          data.totalPoolStars = 0;
          data.status = 'waiting';
          data.winner = undefined;
          data.timeLeft = 30;
          data.lastUpdated = Date.now();
          
          writeGameData(data);
          return res.status(200).json({ success: true, data });
        }

        case 'get_history': {
          const limit = payload?.limit || 50;
          return res.status(200).json({
            success: true,
            history: data.history.slice(-limit).reverse(),
          });
        }

        default:
          return res.status(400).json({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error in POST:', error);
      return res.status(500).json({ error: 'Failed to process request' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}