// src/hooks/useGameBalance.ts
import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';

interface GameBalance {
  ton: number;
  stars: number;
}

export const useGameBalance = () => {
  const { user } = useTelegramUser();
  const [balance, setBalance] = useState<GameBalance>({ ton: 0, stars: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка баланса с сервера
  const fetchBalance = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/user/balance?userId=${user.id}`);
      const result = await response.json();
      
      if (result.success) {
        setBalance(result.data);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Инициализация
  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user, fetchBalance]);

  // Депозит TON
  const depositTon = useCallback(async (amount: number) => {
    if (!user) return;
    try {
      const response = await fetch('/api/user/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'deposit',
          currency: 'ton',
          amount
        })
      });
      const result = await response.json();
      if (result.success) {
        setBalance(result.data);
      }
    } catch (error) {
      console.error('Error depositing TON:', error);
    }
  }, [user]);

  // Депозит Stars
  const depositStars = useCallback(async (amount: number) => {
    if (!user) return;
    try {
      const response = await fetch('/api/user/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'deposit',
          currency: 'stars',
          amount
        })
      });
      const result = await response.json();
      if (result.success) {
        setBalance(result.data);
      }
    } catch (error) {
      console.error('Error depositing Stars:', error);
    }
  }, [user]);

  // Вывод TON
  const withdrawTon = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false;
    if (balance.ton < amount) return false;

    try {
      const response = await fetch('/api/user/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'withdraw',
          currency: 'ton',
          amount
        })
      });
      const result = await response.json();
      if (result.success) {
        setBalance(result.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error withdrawing TON:', error);
      return false;
    }
  }, [user, balance.ton]);

  // Вывод Stars
  const withdrawStars = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false;
    if (balance.stars < amount) return false;

    try {
      const response = await fetch('/api/user/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'withdraw',
          currency: 'stars',
          amount
        })
      });
      const result = await response.json();
      if (result.success) {
        setBalance(result.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error withdrawing Stars:', error);
      return false;
    }
  }, [user, balance.stars]);

  const hasEnoughTon = useCallback((amount: number): boolean => balance.ton >= amount, [balance.ton]);
  const hasEnoughStars = useCallback((amount: number): boolean => balance.stars >= amount, [balance.stars]);

  return {
    balance,
    isLoading,
    depositTon,
    depositStars,
    withdrawTon,
    withdrawStars,
    hasEnoughTon,
    hasEnoughStars,
    refreshBalance: fetchBalance
  };
};