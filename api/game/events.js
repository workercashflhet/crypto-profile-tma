// api/game/events.js
const fs = require('fs');

const DATA_PATH = '/tmp/game_data.json';
let clients = [];

// Функция для отправки события всем клиентам
function sendEventToAll(event, data) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.res.write(message);
    } catch (error) {
      console.error('Error sending to client:', error);
    }
  });
}

// Функция для чтения данных игры
function readGameData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading game data:', error);
  }
  return null;
}

// Мониторинг изменений в файле
let lastModified = 0;
let watchInterval = null;

function startWatching() {
  if (watchInterval) return;
  
  watchInterval = setInterval(() => {
    try {
      if (fs.existsSync(DATA_PATH)) {
        const stats = fs.statSync(DATA_PATH);
        if (stats.mtimeMs > lastModified) {
          lastModified = stats.mtimeMs;
          const data = readGameData();
          if (data) {
            sendEventToAll('game_update', data);
          }
        }
      }
    } catch (error) {
      console.error('Error watching file:', error);
    }
  }, 500); // Проверяем каждые 500ms
}

// Обработчик SSE
module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Настраиваем SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Отправляем начальное состояние
  const initialData = readGameData();
  if (initialData) {
    res.write(`event: game_update\ndata: ${JSON.stringify(initialData)}\n\n`);
  }

  // Добавляем клиента
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res: res,
  };
  clients.push(newClient);

  // Запускаем мониторинг если еще не запущен
  if (!watchInterval) {
    startWatching();
  }

  // Обработка закрытия соединения
  req.on('close', () => {
    clients = clients.filter(client => client.id !== clientId);
    console.log(`Client ${clientId} disconnected. Clients: ${clients.length}`);
    
    // Если нет клиентов, останавливаем мониторинг
    if (clients.length === 0 && watchInterval) {
      clearInterval(watchInterval);
      watchInterval = null;
    }
  });

  // Keep-alive (отправляем ping каждые 30 секунд)
  const pingInterval = setInterval(() => {
    if (res.writable) {
      res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(pingInterval);
  });

  console.log(`Client ${clientId} connected. Clients: ${clients.length}`);
};