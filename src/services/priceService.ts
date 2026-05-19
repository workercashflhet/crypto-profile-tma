import axios from 'axios';

interface TokenPrices {
  ton: number;
  usdt: number;
  lastUpdated: Date | null;
}

let cachedPrices: TokenPrices = {
  ton: 1.92,
  usdt: 1.00,
  lastUpdated: null,
};

// Получение актуальных цен
export const fetchTokenPrices = async (): Promise<TokenPrices> => {
  try {
    // Используем CoinGecko API для получения цен
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network,tether&vs_currencies=usd'
    );
    
    const tonPrice = response.data['the-open-network']?.usd || 1.92;
    const usdtPrice = response.data['tether']?.usd || 1.00;
    
    cachedPrices = {
      ton: tonPrice,
      usdt: usdtPrice,
      lastUpdated: new Date(),
    };
    
    return cachedPrices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    // Возвращаем кешированные цены при ошибке
    if (!cachedPrices.lastUpdated) {
      cachedPrices = {
        ton: 1.92,
        usdt: 1.00,
        lastUpdated: new Date(),
      };
    }
    return cachedPrices;
  }
};

// Конвертация TON в USD
export const tonToUsd = (tonAmount: number): number => {
  return tonAmount * cachedPrices.ton;
};

// Конвертация USDT в USD
export const usdtToUsd = (usdtAmount: number): number => {
  return usdtAmount * cachedPrices.usdt;
};

// Получение текущих цен
export const getTokenPrices = (): TokenPrices => {
  return cachedPrices;
};

// Запуск периодического обновления цен
export const startPriceUpdates = (intervalMs: number = 60000): (() => void) => {
  // Сразу получаем цены
  fetchTokenPrices();
  
  // Обновляем каждую минуту
  const interval = setInterval(fetchTokenPrices, intervalMs);
  
  return () => clearInterval(interval);
};