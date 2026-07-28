// src/hooks/useGameAPI.ts
import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';

export interface Player {
  userId: number;
  username: string;
  firstName: string;
  avatar?: string;
  bets: Bet[];
  totalBet: number;
  currency: 'ton' | 'stars';
  color: string;
}

export interface Bet {
  amount: number;
  currency: 'ton' | 'stars';
  timestamp: number;
}

export interface RoundHistory {
  roundNumber: number;
  roundId: string;
  winner: Player;
  totalPoolTon: number;
  totalPoolStars: number;
  timestamp: number;
}

export interface GameState {
  roundNumber: number;
  roundId: string;
  players: Player[];
  totalPoolTon: number;
  totalPoolStars: number;
  status: 'waiting' | 'active' | 'spinning' | 'finished';
  winner?: Player;
  timeLeft: number;
  lastUpdated: number;
  history: RoundHistory[];
}

const API_URL = '/api/game/state';

export const useGameAPI = () => {
  const { user } = useTelegramUser();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setGameState(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load game state');
      }
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError('Network error - please try again');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const placeBet = useCallback(async (amount: number, currency: 'ton' | 'stars') => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'place_bet',
          payload: {
            userId: user.id,
            username: user.username || `user_${user.id}`,
            firstName: user.firstName,
            avatar: user.photoUrl,
            amount,
            currency,
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGameState(result.data);
        setError(null);
        return true;
      } else {
        setError(result.error || 'Failed to place bet');
        return false;
      }
    } catch (err) {
      console.error('Error placing bet:', err);
      setError('Network error - please try again');
      return false;
    }
  }, [user]);

  const spinWheel = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'spin' }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGameState(result.data);
        setError(null);
        return result.data.winner;
      } else {
        setError(result.error || 'Failed to spin');
        return null;
      }
    } catch (err) {
      console.error('Error spinning:', err);
      setError('Network error - please try again');
      return null;
    }
  }, []);

  const resetGame = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGameState(result.data);
        setError(null);
        return true;
      } else {
        setError(result.error || 'Failed to reset');
        return false;
      }
    } catch (err) {
      console.error('Error resetting game:', err);
      setError('Network error - please try again');
      return false;
    }
  }, []);

  const getHistory = useCallback(async (limit?: number) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_history',
          payload: { limit: limit || 50 },
        }),
      });

      const result = await response.json();
      return result.success ? result.history : [];
    } catch (err) {
      console.error('Error fetching history:', err);
      return [];
    }
  }, []);

  // Автоматическое обновление состояния каждую секунду
  useEffect(() => {
    fetchGameState();
    
    const interval = setInterval(() => {
      fetchGameState();
    }, 1000); // Обновляем каждую секунду для точного таймера
    
    return () => clearInterval(interval);
  }, [fetchGameState]);

  return {
    gameState,
    isLoading,
    error,
    placeBet,
    spinWheel,
    resetGame,
    getHistory,
    fetchGameState,
  };
};