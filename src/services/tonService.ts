import axios from 'axios';

const TON_API_ENDPOINT = 'https://tonapi.io/v2';

// Получаем баланс кошелька в TON
export const getTonBalance = async (address: string): Promise<number> => {
  try {
    const response = await axios.get(`${TON_API_ENDPOINT}/accounts/${address}`);
    const balance = response.data.balance || 0;
    // Конвертируем из наноTON в TON
    return balance / 1_000_000_000;
  } catch (error) {
    console.error('Error fetching TON balance:', error);
    return 0;
  }
};

// Получаем баланс USDT (Jetton)
export const getUsdtBalance = async (address: string): Promise<number> => {
  try {
    // Адрес контракта USDT на TON
    const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
    
    const response = await axios.get(
      `${TON_API_ENDPOINT}/accounts/${address}/jettons/${USDT_MASTER}`
    );
    
    const balance = response.data.balance || 0;
    // USDT имеет 6 десятичных знаков
    return balance / 1_000_000;
  } catch (error) {
    console.error('Error fetching USDT balance:', error);
    return 0;
  }
};