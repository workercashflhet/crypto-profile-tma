import { useState, useEffect, useCallback, useRef } from 'react';
import { PvPRound, PvPPlayer, CurrencyType, PlayerBet } from '../types/pvp';
import { useTelegramUser } from './useTelegramUser';
import { useGameBalance } from './useGameBalance';
import { getTokenPrices } from '../services/priceService';

const ROUND_DURATION = 30;
const AUTO_RESET_DELAY = 10000;
const PLAYER_COLORS: string[] = [
  '#2196F3', '#E91E63', '#00BCD4', '#FF9800', '#4CAF50',
  '#9C27B0', '#FF5722', '#795548', '#607D8B', '#CDDC39',
];

const MOCK_PLAYERS: PvPPlayer[] = [
  { userId: 1001, username: 'crypto_whale', firstName: 'Whale', bets: [], totalBet: 0, currency: 'ton', color: '#2196F3' },
  { userId: 1002, username: 'ton_master', firstName: 'Master', bets: [], totalBet: 0, currency: 'ton', color: '#E91E63' },
  { userId: 1003, username: 'defi_king', firstName: 'King', bets: [], totalBet: 0, currency: 'ton', color: '#00BCD4' },
  { userId: 1004, username: 'nft_pro', firstName: 'Pro', bets: [], totalBet: 0, currency: 'ton', color: '#FF9800' },
  { userId: 1005, username: 'hodler', firstName: 'Hodler', bets: [], totalBet: 0, currency: 'ton', color: '#4CAF50' },
];

export const usePvPGame = () => {
  const { user } = useTelegramUser();
  const {
    balance,
    withdrawTon,
    withdrawUsdt,
    depositTon,
    depositUsdt,
    hasEnoughTon,
    hasEnoughUsdt
  } = useGameBalance();

  const [currentRound, setCurrentRound] = useState<PvPRound | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>('ton');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winner, setWinner] = useState<PvPPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerBets, setPlayerBets] = useState<PlayerBet[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Расчет общего пула в USD эквиваленте
  const getTotalPoolUsd = useCallback((round: PvPRound): number => {
    const prices = getTokenPrices();
    return (round.totalPoolTon * prices.ton) + (round.totalPoolUsdt * prices.usdt);
  }, []);

  // Расчет ставки игрока в USD
  const getPlayerBetUsd = useCallback((player: PvPPlayer): number => {
    const prices = getTokenPrices();
    const tonBets = player.bets.filter(b => b.currency === 'ton').reduce((sum, b) => sum + b.amount, 0);
    const usdtBets = player.bets.filter(b => b.currency === 'usdt').reduce((sum, b) => sum + b.amount, 0);
    return (tonBets * prices.ton) + (usdtBets * prices.usdt);
  }, []);

  const initRound = useCallback(() => {
    if (!user) return;

    const newRound: PvPRound = {
      id: `round_${Date.now()}`,
      players: [],
      totalPoolTon: 0,
      totalPoolUsdt: 0,
      timeLeft: ROUND_DURATION,
      status: 'waiting',
      timestamp: Date.now(),
    };

    setCurrentRound(newRound);
    setWinner(null);
    setIsSpinning(false);
    setRotationAngle(0);
    setError(null);
    setPlayerBets([]);

    if (autoResetRef.current) {
      clearTimeout(autoResetRef.current);
      autoResetRef.current = null;
    }
  }, [user]);

  const addBotPlayer = useCallback(() => {
    setCurrentRound(prev => {
      if (!prev) return prev;
      if (prev.status === 'finished' || prev.status === 'spinning') return prev;
      if (prev.timeLeft <= 5) return prev;

      const availableBots = MOCK_PLAYERS.filter(
        bot => !prev.players.find(p => p.userId === bot.userId)
      );

      if (availableBots.length === 0) return prev;

      const randomBot = { ...availableBots[Math.floor(Math.random() * availableBots.length)] };
      const randomBetAmount = Math.floor(Math.random() * 50) + 5;
      const botCurrency: CurrencyType = Math.random() > 0.3 ? 'ton' : 'usdt';

      const playerColors = prev.players.map(p => p.color);
      const availableColors = PLAYER_COLORS.filter(c => !playerColors.includes(c));
      const botColor = availableColors.length > 0
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

      const botBets: PlayerBet[] = [{
        amount: randomBetAmount,
        currency: botCurrency,
        timestamp: Date.now(),
      }];

      const newBotPlayer: PvPPlayer = {
        userId: randomBot.userId,
        username: randomBot.username,
        firstName: randomBot.firstName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=bot${randomBot.userId}`,
        bets: botBets,
        totalBet: randomBetAmount,
        currency: botCurrency,
        color: botColor,
      };

      const updatedPlayers = [...prev.players, newBotPlayer];
      const totalTon = updatedPlayers.reduce((sum, p) => {
        return sum + p.bets.filter(b => b.currency === 'ton').reduce((s, b) => s + b.amount, 0);
      }, 0);
      const totalUsdt = updatedPlayers.reduce((sum, p) => {
        return sum + p.bets.filter(b => b.currency === 'usdt').reduce((s, b) => s + b.amount, 0);
      }, 0);

      return {
        ...prev,
        players: updatedPlayers,
        totalPoolTon: totalTon,
        totalPoolUsdt: totalUsdt,
        status: prev.players.length === 0 ? 'active' : prev.status,
      };
    });
  }, []);

  // Боты
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'active') {
      if (botsTimerRef.current) {
        clearInterval(botsTimerRef.current);
        botsTimerRef.current = null;
      }
      return;
    }

    botsTimerRef.current = setInterval(() => {
      addBotPlayer();
    }, 4000 + Math.random() * 3000);

    return () => {
      if (botsTimerRef.current) {
        clearInterval(botsTimerRef.current);
        botsTimerRef.current = null;
      }
    };
  }, [currentRound?.status, addBotPlayer]);

  // Таймер
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'active') return;

    timerRef.current = setInterval(() => {
      setCurrentRound(prev => {
        if (!prev) return prev;

        const newTimeLeft = prev.timeLeft - 1;

        if (newTimeLeft <= 0) {
          if (prev.players.length === 0) {
            return { ...prev, timeLeft: ROUND_DURATION, status: 'waiting' };
          }
          return { ...prev, timeLeft: 0, status: 'spinning' };
        }

        return { ...prev, timeLeft: newTimeLeft };
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentRound?.status]);

  // Множественные ставки
  const placeBet = useCallback((amount: number, currency: CurrencyType): boolean => {
    if (!user || !currentRound) return false;
    if (currentRound.status === 'finished' || currentRound.status === 'spinning') return false;
    if (amount <= 0) return false;

    if (currency === 'ton') {
      if (!hasEnoughTon(amount)) {
        setError(`Insufficient TON balance. You have ${balance.ton.toFixed(1)} TON`);
        setTimeout(() => setError(null), 3000);
        return false;
      }
    } else {
      if (!hasEnoughUsdt(amount)) {
        setError(`Insufficient USDT balance. You have ${balance.usdt.toFixed(1)} USDT`);
        setTimeout(() => setError(null), 3000);
        return false;
      }
    }

    if (currency === 'ton') {
      withdrawTon(amount);
    } else {
      withdrawUsdt(amount);
    }

    const newBet: PlayerBet = {
      amount,
      currency,
      timestamp: Date.now(),
    };

    setPlayerBets(prev => [...prev, newBet]);

    setCurrentRound(prev => {
      if (!prev) return prev;

      const existingPlayerIndex = prev.players.findIndex(p => p.userId === user.id);
      let updatedPlayers: PvPPlayer[];

      if (existingPlayerIndex >= 0) {
        updatedPlayers = prev.players.map((p, i) => {
          if (i === existingPlayerIndex) {
            const updatedBets = [...p.bets, newBet];
            const newTotal = updatedBets.reduce((sum, b) => sum + b.amount, 0);
            return {
              ...p,
              bets: updatedBets,
              totalBet: newTotal,
              currency: currency,
            };
          }
          return p;
        });
      } else {
        const playerColors = prev.players.map(p => p.color);
        const availableColors = PLAYER_COLORS.filter(c => !playerColors.includes(c));
        const assignedColor = availableColors.length > 0
          ? availableColors[Math.floor(Math.random() * availableColors.length)]
          : PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

        const newPlayer: PvPPlayer = {
          userId: user.id,
          username: user.username || `user_${user.id}`,
          firstName: user.firstName,
          avatar: user.photoUrl || undefined,
          bets: [newBet],
          totalBet: amount,
          currency: currency,
          color: assignedColor,
        };

        updatedPlayers = [...prev.players, newPlayer];
      }

      const totalTon = updatedPlayers.reduce((sum, p) => {
        return sum + p.bets.filter(b => b.currency === 'ton').reduce((s, b) => s + b.amount, 0);
      }, 0);
      const totalUsdt = updatedPlayers.reduce((sum, p) => {
        return sum + p.bets.filter(b => b.currency === 'usdt').reduce((s, b) => s + b.amount, 0);
      }, 0);

      const newStatus = prev.players.length === 0 ? 'active' : prev.status;

      return {
        ...prev,
        players: updatedPlayers,
        totalPoolTon: totalTon,
        totalPoolUsdt: totalUsdt,
        status: newStatus,
      };
    });

    if (currentRound.players.length === 0) {
      setTimeout(() => {
        addBotPlayer();
        setTimeout(() => addBotPlayer(), 1500);
      }, 1000);
    }

    return true;
  }, [user, currentRound, addBotPlayer, withdrawTon, withdrawUsdt, hasEnoughTon, hasEnoughUsdt, balance]);

  // Вычисление сегментов на основе USD эквивалента
  const calculateSegments = useCallback(() => {
    if (!currentRound || currentRound.players.length === 0) return [];

    const totalPoolUsd = getTotalPoolUsd(currentRound);
    if (totalPoolUsd === 0) return [];

    let currentAngle = 0;

    return currentRound.players.map((player) => {
      const playerUsd = getPlayerBetUsd(player);
      const percentage = playerUsd / totalPoolUsd;
      const sectorAngle = percentage * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sectorAngle;

      currentAngle = endAngle;

      return {
        color: player.color,
        percentage: percentage * 100,
        player,
        startAngle,
        endAngle,
      };
    });
  }, [currentRound, getTotalPoolUsd, getPlayerBetUsd]);

  // Спин колеса
  const spinWheel = useCallback(() => {
    if (!currentRound || currentRound.players.length === 0) return;
    if (isSpinning) return;

    setIsSpinning(true);
    setCurrentRound(prev => prev ? { ...prev, status: 'spinning' } : prev);

    const segments = calculateSegments();

    const stopAngle = Math.random() * 360;
    const totalRotation = 360 * 8 + (360 - stopAngle);
    setRotationAngle(totalRotation);

    let winnerPlayer: PvPPlayer | null = null;

    for (const segment of segments) {
      if (stopAngle >= segment.startAngle && stopAngle < segment.endAngle) {
        winnerPlayer = segment.player;
        break;
      }
    }

    if (!winnerPlayer && segments.length > 0) {
      winnerPlayer = segments[0].player;
    }

    setTimeout(() => {
      if (winnerPlayer) {
        setWinner(winnerPlayer);
        setCurrentRound(prev =>
          prev ? { ...prev, status: 'finished', winner: winnerPlayer! } : prev
        );

        if (winnerPlayer.userId === user?.id && currentRound) {
          depositTon(currentRound.totalPoolTon);
          depositUsdt(currentRound.totalPoolUsdt);
        }

        autoResetRef.current = setTimeout(() => {
          initRound();
        }, AUTO_RESET_DELAY);
      }
      setIsSpinning(false);
    }, 5000);
  }, [currentRound, isSpinning, calculateSegments, user?.id, depositTon, depositUsdt, initRound]);

  const resetRound = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (botsTimerRef.current) {
      clearInterval(botsTimerRef.current);
      botsTimerRef.current = null;
    }
    if (autoResetRef.current) {
      clearTimeout(autoResetRef.current);
      autoResetRef.current = null;
    }
    initRound();
  }, [initRound]);

  useEffect(() => {
    initRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botsTimerRef.current) clearInterval(botsTimerRef.current);
      if (autoResetRef.current) clearTimeout(autoResetRef.current);
    };
  }, [initRound]);

  const getTotalPool = useCallback(() => {
    if (!currentRound) return '0';
    const parts: string[] = [];
    if (currentRound.totalPoolTon > 0) parts.push(`${currentRound.totalPoolTon} TON`);
    if (currentRound.totalPoolUsdt > 0) parts.push(`${currentRound.totalPoolUsdt} USDT`);
    return parts.join(' + ') || '0';
  }, [currentRound]);

  return {
    currentRound,
    betAmount,
    setBetAmount,
    selectedCurrency,
    setSelectedCurrency,
    isSpinning,
    rotationAngle,
    winner,
    error,
    balance,
    playerBets,
    calculateSegments,
    placeBet,
    spinWheel,
    resetRound,
    getTotalPool,
    getTokenPrices,
    depositTon,
    depositUsdt,
  };
};