import axios from 'axios';

interface TokenPrices {
  ton: number;
  stars: number; // Telegram Stars всегда ~$0.013
  lastUpdated: Date | null;
}

let cachedPrices: TokenPrices = {
  ton: 1.92,
  stars: 0.013, // 1 Star = $0.013
  lastUpdated: null,
};

export const fetchTokenPrices = async (): Promise<TokenPrices> => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
    );
    
    const tonPrice = response.data['the-open-network']?.usd || 1.92;
    
    cachedPrices = {
      ton: tonPrice,
      stars: 0.013,
      lastUpdated: new Date(),
    };
    
    return cachedPrices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    if (!cachedPrices.lastUpdated) {
      cachedPrices = {
        ton: 1.92,
        stars: 0.013,
        lastUpdated: new Date(),
      };
    }
    return cachedPrices;
  }
};

export const tonToUsd = (tonAmount: number): number => {
  return tonAmount * cachedPrices.ton;
};

export const starsToUsd = (starsAmount: number): number => {
  return starsAmount * cachedPrices.stars;
};

export const getTokenPrices = (): TokenPrices => {
  return cachedPrices;
};

export const startPriceUpdates = (intervalMs: number = 60000): (() => void) => {
  fetchTokenPrices();
  const interval = setInterval(fetchTokenPrices, intervalMs);
  return () => clearInterval(interval);
};