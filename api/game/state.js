// api/game/state.js
const fs = require('fs');

const DATA_PATH = '/tmp/game_data.json';
const ROUND_DURATION = 30;
const MIN_PLAYERS_TO_START = 2;

function getDefaultGameData() {
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
    history: [], // <-- Убеждаемся, что history всегда есть
  };
}

function readGameData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      const parsed = JSON.parse(data);
      
      // Проверяем наличие всех полей
      if (!parsed.history) {
        parsed.history = [];
      }
      if (parsed.timerStarted === undefined) {
        parsed.timerStarted = false;
      }
      if (!parsed.roundId) {
        parsed.roundId = `round_${Date.now()}`;
      }
      if (!parsed.players) {
        parsed.players = [];
      }
      if (parsed.timeLeft === undefined) {
        parsed.timeLeft = ROUND_DURATION;
      }
      
      return parsed;
    }
  } catch (error) {
    console.error('Error reading game data:', error);
  }
  return getDefaultGameData();
}

function writeGameData(data) {
  try {
    // Убеждаемся, что history существует
    if (!data.history) {
      data.history = [];
    }
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing game data:', error);
  }
}

function spinWheel(data) {
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

  return {
    winner: winner,
    historyEntry: {
      roundNumber: data.roundNumber,
      roundId: data.roundId,
      winner: winner,
      totalPoolTon: data.totalPoolTon,
      totalPoolStars: data.totalPoolStars,
      timestamp: Date.now(),
    }
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const data = readGameData();
      
      // Убеждаемся, что history существует
      if (!data.history) {
        data.history = [];
      }
      
      // Если таймер запущен, уменьшаем время
      if (data.timerStarted && data.status === 'active') {
        const elapsed = Math.floor((Date.now() - data.lastUpdated) / 1000);
        data.timeLeft = Math.max(0, data.timeLeft - elapsed);
        data.lastUpdated = Date.now();
        
        if (data.timeLeft <= 0 && data.players.length >= MIN_PLAYERS_TO_START) {
          data.status = 'spinning';
          data.timeLeft = 0;
          writeGameData(data);
          
          const result = spinWheel(data);
          data.status = 'finished';
          data.winner = result.winner;
          
          // Убеждаемся, что history существует перед push
          if (!data.history) {
            data.history = [];
          }
          data.history.push(result.historyEntry);
          
          data.roundNumber += 1;
          data.roundId = `round_${Date.now()}`;
          data.timerStarted = false;
          writeGameData(data);
        }
      }
      
      // Безопасно получаем историю (последние 10 записей)
      const history = data.history || [];
      
      return res.status(200).json({
        success: true,
        data: {
          ...data,
          history: history.slice(-10),
        },
      });
    } catch (error) {
      console.error('Error in GET:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to get game state',
        details: error.message 
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, payload } = req.body;
      const data = readGameData();
      
      // Убеждаемся, что history существует
      if (!data.history) {
        data.history = [];
      }

      switch (action) {
        case 'place_bet': {
          const { userId, username, firstName, avatar, amount, currency } = payload;
          
          if (data.status === 'spinning' || data.status === 'finished') {
            return res.status(400).json({ error: 'Game is already in progress' });
          }

          let player = data.players.find(p => p.userId === userId);
          
          if (player) {
            player.bets.push({ amount, currency, timestamp: Date.now() });
            player.totalBet += amount;
          } else {
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

          if (currency === 'ton') {
            data.totalPoolTon += amount;
          } else {
            data.totalPoolStars += amount;
          }

          if (data.players.length >= MIN_PLAYERS_TO_START && 
              (data.status === 'waiting' || data.status === 'active') && 
              !data.timerStarted) {
            data.status = 'active';
            data.timerStarted = true;
            data.timeLeft = ROUND_DURATION;
            data.lastUpdated = Date.now();
          }

          writeGameData(data);
          return res.status(200).json({ success: true, data });
        }

        case 'spin': {
          if (data.players.length < MIN_PLAYERS_TO_START) {
            return res.status(400).json({ error: 'Not enough players' });
          }

          const result = spinWheel(data);
          data.status = 'finished';
          data.winner = result.winner;
          
          if (!data.history) {
            data.history = [];
          }
          data.history.push(result.historyEntry);
          
          data.roundNumber += 1;
          data.roundId = `round_${Date.now()}`;
          data.timerStarted = false;
          
          writeGameData(data);
          return res.status(200).json({ success: true, data });
        }

        case 'reset': {
          data.players = [];
          data.totalPoolTon = 0;
          data.totalPoolStars = 0;
          data.status = 'waiting';
          data.winner = undefined;
          data.timeLeft = ROUND_DURATION;
          data.lastUpdated = Date.now();
          data.timerStarted = false;
          // Не сбрасываем историю
          
          writeGameData(data);
          return res.status(200).json({ success: true, data });
        }

        case 'get_history': {
          const limit = payload?.limit || 50;
          const history = data.history || [];
          return res.status(200).json({
            success: true,
            history: history.slice(-limit).reverse(),
          });
        }

        default:
          return res.status(400).json({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error in POST:', error);
      return res.status(500).json({ 
        error: 'Failed to process request',
        details: error.message 
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};