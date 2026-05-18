import { useState, useEffect, useCallback } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { getTonBalance, getUsdtBalance, isValidTonAddress } from '../services/tonService';

interface WalletBalances {
  ton: number;
  usdt: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useWalletBalance = (): WalletBalances => {
  const wallet = useTonWallet();
  const [balances, setBalances] = useState<WalletBalances>({
    ton: 0,
    usdt: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchBalances = useCallback(async () => {
    if (!wallet?.account?.address) return;

    const address = wallet.account.address;
    
    // Проверяем валидность адреса
    if (!isValidTonAddress(address)) {
      setBalances(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid wallet address',
      }));
      return;
    }

    setBalances(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Получаем оба баланса параллельно
      const [tonBalance, usdtBalance] = await Promise.all([
        getTonBalance(address),
        getUsdtBalance(address),
      ]);

      setBalances({
        ton: tonBalance,
        usdt: usdtBalance,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching balances:', error);
      setBalances(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch balances',
      }));
    }
  }, [wallet]);

  // Загружаем балансы при подключении кошелька
  useEffect(() => {
    if (wallet) {
      fetchBalances();
      
      // Автообновление каждые 30 секунд
      const interval = setInterval(fetchBalances, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Сбрасываем балансы при отключении кошелька
      setBalances({
        ton: 0,
        usdt: 0,
        isLoading: false,
        error: null,
        lastUpdated: null,
      });
    }
  }, [wallet, fetchBalances]);

  return balances;
};