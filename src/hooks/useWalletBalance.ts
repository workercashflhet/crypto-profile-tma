import { useState, useEffect, useCallback } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { getTonBalance } from '../services/tonService';

interface WalletBalances {
  ton: number;
  stars: number;
  isLoading: boolean;
  error: string | null;
}

export const useWalletBalance = (): WalletBalances => {
  const wallet = useTonWallet();
  const [balances, setBalances] = useState<WalletBalances>({
    ton: 0,
    stars: 0,
    isLoading: false,
    error: null,
  });

  const fetchBalances = useCallback(async () => {
    if (!wallet?.account?.address) return;

    const address = wallet.account.address;

    setBalances(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const tonBalance = await getTonBalance(address);

      setBalances({
        ton: tonBalance,
        stars: 0, // Stars не на блокчейне TON
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching balances:', error);
      setBalances(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load balances',
      }));
    }
  }, [wallet]);

  useEffect(() => {
    if (wallet) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [wallet, fetchBalances]);

  return balances;
};