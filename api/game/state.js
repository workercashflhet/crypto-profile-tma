// api/game/state.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Динамический импорт fs для работы в Node.js окружении
let fs: any;
try {
  fs = await import('fs');
} catch (e) {
  // В браузере fs не доступен
  console.warn('fs module not available');
}

// Путь к файлу с данными (в /tmp для Vercel)
const DATA_PATH = '/tmp/game_data.json';

// ... остальной код

// Функции readGameData и writeGameData используют fs
// Оберните их в проверку
function readGameData(): GameData {
  try {
    if (fs && fs.existsSync && fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading game data:', error);
  }
  return getDefaultGameData();
}

function writeGameData(data: GameData): void {
  try {
    if (fs && fs.writeFileSync) {
      fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error writing game data:', error);
  }
}