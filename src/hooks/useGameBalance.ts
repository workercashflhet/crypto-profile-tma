import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';

interface GameBalance {
  ton: number;
  usdt: number;
}

const STORAGE_KEY = 'game_balance_v2'; // Новая версия для сброса

// Флаг для принудительного пополнения
const REFILL_AMOUNT = {
  ton: 1000,
  usdt: 1000,
};

export const useGameBalance = () => {
  const { user } = useTelegramUser();
  const [balance, setBalance] = useState<GameBalance>({ ton: 0, usdt: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      const refilled = localStorage.getItem(`${STORAGE_KEY}_refilled_${user.id}`);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Проверяем, было ли пополнение в этой версии
        if (!refilled) {
          // Пополняем баланс
          const newBalance = {
            ton: (parsed.ton || 0) + REFILL_AMOUNT.ton,
            usdt: (parsed.usdt || 0) + REFILL_AMOUNT.usdt,
          };
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
          localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
          setBalance(newBalance);
        } else {
          setBalance({
            ton: parsed.ton || 0,
            usdt: parsed.usdt || 0,
          });
        }
      } else {
        // Новый пользователь - стартовый бонус
        const initialBalance: GameBalance = {
          ton: 1000,
          usdt: 1000,
        };
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(initialBalance));
        localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
        setBalance(initialBalance);
      }
    } catch (error) {
      console.error('Error loading game balance:', error);
      const defaultBalance: GameBalance = { ton: 1000, usdt: 1000 };
      setBalance(defaultBalance);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(defaultBalance));
      localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveBalance = useCallback((newBalance: GameBalance) => {
    if (!user) return;
    localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
    setBalance(newBalance);
  }, [user]);

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