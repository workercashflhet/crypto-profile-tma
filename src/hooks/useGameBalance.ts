import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';

interface GameBalance {
  ton: number;
  usdt: number;
}

const STORAGE_KEY = 'game_balance_v3';
const REFILL_AMOUNT = {
  ton: 1000,
  usdt: 1000,
};

export const useGameBalance = () => {
  const { user } = useTelegramUser();
  const [balance, setBalance] = useState<GameBalance>({ ton: 0, usdt: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка баланса
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
        const initialBalance: GameBalance = {
          ton: 2000,
          usdt: 2000,
        };
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(initialBalance));
        localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
        setBalance(initialBalance);
      }
    } catch (error) {
      console.error('Error loading game balance:', error);
      const defaultBalance: GameBalance = { ton: 2000, usdt: 2000 };
      setBalance(defaultBalance);
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(defaultBalance));
      localStorage.setItem(`${STORAGE_KEY}_refilled_${user.id}`, 'true');
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

  // Пополнение TON - вызывается из DepositModal после успешной транзакции
  const depositTon = useCallback((amount: number) => {
    if (!user) return;
    
    setBalance(prev => {
      const newBalance = { ...prev, ton: prev.ton + amount };
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      console.log(`✅ Deposited ${amount} TON. New balance: ${newBalance.ton} TON`);
      return newBalance;
    });
  }, [user]);

  // Пополнение USDT
  const depositUsdt = useCallback((amount: number) => {
    if (!user) return;
    
    setBalance(prev => {
      const newBalance = { ...prev, usdt: prev.usdt + amount };
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      console.log(`✅ Deposited ${amount} USDT. New balance: ${newBalance.usdt} USDT`);
      return newBalance;
    });
  }, [user]);

  // Списание TON
  const withdrawTon = useCallback((amount: number): boolean => {
    if (!user) return false;
    
    let success = false;
    setBalance(prev => {
      if (prev.ton < amount) return prev;
      const newBalance = { ...prev, ton: prev.ton - amount };
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
      success = true;
      return newBalance;
    });
    return success;
  }, [user]);

  // Списание USDT
  const withdrawUsdt = useCallback((amount: number): boolean => {
    if (!user) return false;
    
    let success = false;
    setBalance(prev => {
      if (prev.usdt < amount) return prev;
      const newBalance = { ...prev, usdt: prev.usdt - amount };
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newBalance));
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