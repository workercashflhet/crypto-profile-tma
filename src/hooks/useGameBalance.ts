import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';

interface GameBalance {
  ton: number;
  stars: number;
}

const STORAGE_KEY = 'game_balance_v4';
const REFILL_AMOUNT = {
  ton: 1000,
  stars: 1000,
};

export const useGameBalance = () => {
  const { user } = useTelegramUser();
  const [balance, setBalance] = useState<GameBalance>({ ton: 0, stars: 0 });
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
        
        if (!refilled) {
          const newBalance = {
            ton: (parsed.ton || 0) + REFILL_AMOUNT.ton,
            stars: (parsed.stars || 0) + REFILL_AMOUNT.stars,
          };
          localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
          localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
          setBalance(newBalance);
        } else {
          setBalance({
            ton: parsed.ton || 0,
            stars: parsed.stars || 0,
          });
        }
      } else {
        const initialBalance: GameBalance = {
          ton: 2000,
          stars: 2000,
        };
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(initialBalance));
        localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
        setBalance(initialBalance);
      }
    } catch (error) {
      console.error('Error loading game balance:', error);
      const defaultBalance: GameBalance = { ton: 2000, stars: 2000 };
      setBalance(defaultBalance);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(defaultBalance));
      localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const depositTon = useCallback((amount: number) => {
    setBalance(prev => {
      const newBalance = { ...prev, ton: prev.ton + amount };
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      return newBalance;
    });
  }, [user]);

  const depositStars = useCallback((amount: number) => {
    setBalance(prev => {
      const newBalance = { ...prev, stars: prev.stars + amount };
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      return newBalance;
    });
  }, [user]);

  const withdrawTon = useCallback((amount: number): boolean => {
    let success = false;
    setBalance(prev => {
      if (prev.ton < amount) return prev;
      const newBalance = { ...prev, ton: prev.ton - amount };
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      success = true;
      return newBalance;
    });
    return success;
  }, [user]);

  const withdrawStars = useCallback((amount: number): boolean => {
    let success = false;
    setBalance(prev => {
      if (prev.stars < amount) return prev;
      const newBalance = { ...prev, stars: prev.stars - amount };
      if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      success = true;
      return newBalance;
    });
    return success;
  }, [user]);

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
  };
};