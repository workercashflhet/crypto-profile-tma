import { useState, useEffect, useCallback, useRef } from 'react';
import { PvPRound, PvPPlayer } from '../types/pvp';
import { useTelegramUser } from './useTelegramUser';

const ROUND_DURATION = 30;
const PLAYER_COLORS: string[] = [
  '#2196F3', '#E91E63', '#00BCD4', '#FF9800', '#4CAF50',
  '#9C27B0', '#FF5722', '#795548', '#607D8B', '#CDDC39',
];

// Мок-игроки
const MOCK_PLAYERS: PvPPlayer[] = [
  { userId: 1001, username: 'crypto_whale', firstName: 'Whale', bet: 0, color: '#2196F3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=whale' },
  { userId: 1002, username: 'ton_master', firstName: 'Master', bet: 0, color: '#E91E63', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=master' },
  { userId: 1003, username: 'defi_king', firstName: 'King', bet: 0, color: '#00BCD4', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=king' },
  { userId: 1004, username: 'nft_pro', firstName: 'Pro', bet: 0, color: '#FF9800', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pro' },
  { userId: 1005, username: 'hodler', firstName: 'Hodler', bet: 0, color: '#4CAF50', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hodler' },
];

export const usePvPGame = () => {
  const { user } = useTelegramUser();
  const [currentRound, setCurrentRound] = useState<PvPRound | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winner, setWinner] = useState<PvPPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Инициализация нового раунда
  const initRound = useCallback(() => {
    if (!user) return;

    const newRound: PvPRound = {
      id: `round_${Date.now()}`,
      players: [],
      totalPool: 0,
      timeLeft: ROUND_DURATION,
      status: 'waiting',
      timestamp: Date.now(),
    };

    setCurrentRound(newRound);
    setWinner(null);
    setIsSpinning(false);
    setRotationAngle(0);
  }, [user]);

  // Добавление ботов-игроков
  const addBotPlayer = useCallback(() => {
    setCurrentRound(prev => {
      if (!prev) return prev;
      if (prev.status === 'finished' || prev.status === 'spinning') return prev;
      if (prev.timeLeft <= 5) return prev;

      const availableBots = MOCK_PLAYERS.filter(
        bot => !prev.players.find(p => p.userId === bot.userId)
      );
      
      if (availableBots.length === 0) return prev;

      const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)];
      const randomBet = Math.floor(Math.random() * 50) + 5;
      
      // Назначаем новый цвет боту
      const playerColors = prev.players.map(p => p.color);
      const availableColors = PLAYER_COLORS.filter(c => !playerColors.includes(c));
      const botColor = availableColors.length > 0 
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

      const newBotPlayer: PvPPlayer = {
        ...randomBot,
        bet: randomBet,
        color: botColor,
      };

      const updatedPlayers = [...prev.players, newBotPlayer];
      const updatedPool = updatedPlayers.reduce((sum, p) => sum + p.bet, 0);
      const newStatus = prev.players.length === 0 ? 'active' : prev.status;

      return {
        ...prev,
        players: updatedPlayers,
        totalPool: updatedPool,
        status: newStatus,
      };
    });
  }, []);

  // Запуск ботов
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'active') {
      if (botsTimerRef.current) {
        clearInterval(botsTimerRef.current);
        botsTimerRef.current = null;
      }
      return;
    }

    botsTimerRef.current = setInterval(() => {
      const randomDelay = Math.random() * 4000 + 3000;
      setTimeout(() => {
        addBotPlayer();
      }, randomDelay);
    }, 5000);

    return () => {
      if (botsTimerRef.current) {
        clearInterval(botsTimerRef.current);
        botsTimerRef.current = null;
      }
    };
  }, [currentRound?.status, addBotPlayer]);

  // Таймер обратного отсчета
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

  // Добавление игрока в пул
  const placeBet = useCallback((amount: number) => {
    if (!user || !currentRound) return;
    if (currentRound.status === 'finished' || currentRound.status === 'spinning') return;
    if (amount <= 0) return;

    const existingPlayer = currentRound.players.find(p => p.userId === user.id);
    if (existingPlayer) return;

    // Автоматически назначаем цвет
    const playerColors = currentRound.players.map(p => p.color);
    const availableColors = PLAYER_COLORS.filter(c => !playerColors.includes(c));
    const assignedColor = availableColors.length > 0 
      ? availableColors[Math.floor(Math.random() * availableColors.length)]
      : PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

    const newPlayer: PvPPlayer = {
      userId: user.id,
      username: user.username || `user_${user.id}`,
      firstName: user.firstName,
      avatar: user.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      bet: amount,
      color: assignedColor,
    };

    setCurrentRound(prev => {
      if (!prev) return prev;

      const updatedPlayers = [...prev.players, newPlayer];
      const updatedPool = updatedPlayers.reduce((sum, p) => sum + p.bet, 0);
      const newStatus = prev.players.length === 0 ? 'active' : prev.status;

      return {
        ...prev,
        players: updatedPlayers,
        totalPool: updatedPool,
        status: newStatus,
      };
    });

    // Добавляем ботов
    setTimeout(() => {
      addBotPlayer();
      setTimeout(() => addBotPlayer(), 1500);
    }, 1000);
  }, [user, currentRound, addBotPlayer]);

  // Вычисление углов секторов
  const calculateSegments = useCallback(() => {
    if (!currentRound || currentRound.players.length === 0) return [];

    return currentRound.players.map((player, index) => {
      const percentage = (player.bet / currentRound.totalPool) * 100;
      const startAngle = index === 0 ? 0 : 
        currentRound.players.slice(0, index).reduce((sum, p) => 
          sum + (p.bet / currentRound.totalPool) * 360, 0
        );
      const endAngle = startAngle + (percentage * 360) / 100;

      return {
        color: player.color,
        percentage,
        player,
        startAngle,
        endAngle,
      };
    });
  }, [currentRound]);

  // Спин колеса
  const spinWheel = useCallback(() => {
    if (!currentRound || currentRound.players.length === 0) return;
    if (isSpinning) return;

    setIsSpinning(true);
    setCurrentRound(prev => prev ? { ...prev, status: 'spinning' } : prev);

    const randomAngle = Math.random() * 360;
    const totalRotation = 3600 + randomAngle;
    setRotationAngle(totalRotation);

    setTimeout(() => {
      const segments = calculateSegments();
      const normalizedAngle = randomAngle;
      
      let winnerPlayer: PvPPlayer | undefined;
      
      for (const segment of segments) {
        if (normalizedAngle >= segment.startAngle && normalizedAngle < segment.endAngle) {
          winnerPlayer = segment.player;
          break;
        }
      }

      if (!winnerPlayer && segments.length > 0) {
        winnerPlayer = segments[0].player;
      }

      if (winnerPlayer) {
        setWinner(winnerPlayer);
        setCurrentRound(prev => 
          prev ? { ...prev, status: 'finished', winner: winnerPlayer } : prev
        );
      }

      setIsSpinning(false);
    }, 5000);
  }, [currentRound, isSpinning, calculateSegments]);

  // Сброс раунда
  const resetRound = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (botsTimerRef.current) {
      clearInterval(botsTimerRef.current);
      botsTimerRef.current = null;
    }
    initRound();
  }, [initRound]);

  // Инициализация
  useEffect(() => {
    initRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (botsTimerRef.current) clearInterval(botsTimerRef.current);
    };
  }, [initRound]);

  return {
    currentRound,
    betAmount,
    setBetAmount,
    isSpinning,
    rotationAngle,
    winner,
    calculateSegments,
    placeBet,
    spinWheel,
    resetRound,
  };
};