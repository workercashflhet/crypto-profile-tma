import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';

interface GameBalance {
  ton: number;
  usdt: number;
}

const STORAGE_KEY = 'game_balance';

export const useGameBalance = () => {
  const { user } = useTelegramUser();
  const [balance, setBalance] = useState<GameBalance>({ ton: 0, usdt: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка баланса при старте
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        setBalance({
          ton: parsed.ton || 0,
          usdt: parsed.usdt || 0,
        });
      } else {
        // Стартовый бонус для новых игроков
        const initialBalance: GameBalance = {
          ton: 100, // 100 TON для теста
          usdt: 1000, // 1000 USDT для теста
        };
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(initialBalance));
        setBalance(initialBalance);
      }
    } catch (error) {
      console.error('Error loading game balance:', error);
      // Устанавливаем дефолтный баланс при ошибке
      const defaultBalance: GameBalance = { ton: 100, usdt: 1000 };
      setBalance(defaultBalance);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(defaultBalance));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Сохранение баланса
  const saveBalance = useCallback((newBalance: GameBalance) => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
    setBalance(newBalance);
  }, [user]);

  // Пополнение баланса
  const depositTon = useCallback((amount: number) => {
    setBalance(prev => {
      const newBalance = { ...prev, ton: prev.ton + amount };
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      }
      return newBalance;
    });
  }, [user]);

  const depositUsdt = useCallback((amount: number) => {
    setBalance(prev => {
      const newBalance = { ...prev, usdt: prev.usdt + amount };
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      }
      return newBalance;
    });
  }, [user]);

  // Списание средств
  const withdrawTon = useCallback((amount: number): boolean => {
    let success = false;
    setBalance(prev => {
      if (prev.ton < amount) return prev;
      const newBalance = { ...prev, ton: prev.ton - amount };
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      }
      success = true;
      return newBalance;
    });
    return success;
  }, [user]);

  const withdrawUsdt = useCallback((amount: number): boolean => {
    let success = false;
    setBalance(prev => {
      if (prev.usdt < amount) return prev;
      const newBalance = { ...prev, usdt: prev.usdt - amount };
      if (user) {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      }
      success = true;
      return newBalance;
    });
    return success;
  }, [user]);

  // Проверка достаточности средств
  const hasEnoughTon = useCallback((amount: number): boolean => {
    return balance.ton >= amount;
  }, [balance.ton]);

  const hasEnoughUsdt = useCallback((amount: number): boolean => {
    return balance.usdt >= amount;
  }, [balance.usdt]);

  return {
    balance,
    isLoading,
    depositTon,
    depositUsdt,
    withdrawTon,
    withdrawUsdt,
    hasEnoughTon,
    hasEnoughUsdt,
    saveBalance,
  };
};