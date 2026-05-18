import { useState, useEffect, useCallback, useRef } from 'react';
import { PvPRound, PvPPlayer } from '../types/pvp';
import { useTelegramUser } from './useTelegramUser';

const ROUND_DURATION = 30; // секунд
const COLORS: string[] = ['#2196F3', '#E91E63', '#00BCD4']; // blue, pink, cyan

export const usePvPGame = () => {
  const { user } = useTelegramUser();
  const [currentRound, setCurrentRound] = useState<PvPRound | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [winner, setWinner] = useState<PvPPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Таймер обратного отсчета
  useEffect(() => {
    if (!currentRound || currentRound.status !== 'active') return;

    timerRef.current = setInterval(() => {
      setCurrentRound(prev => {
        if (!prev) return prev;
        
        const newTimeLeft = prev.timeLeft - 1;
        
        if (newTimeLeft <= 0) {
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
  const placeBet = useCallback((amount: number, color: string) => {
    if (!user || !currentRound) return;
    if (currentRound.status === 'finished' || currentRound.status === 'spinning') return;
    if (amount <= 0) return;

    // Проверяем, не делал ли уже игрок ставку
    const existingPlayer = currentRound.players.find(p => p.userId === user.id);
    if (existingPlayer) return;

    const newPlayer: PvPPlayer = {
      userId: user.id,
      username: user.username || `user_${user.id}`,
      firstName: user.firstName,
      avatar: user.photoUrl,
      bet: amount,
      color: color as 'blue' | 'pink' | 'cyan',
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
  }, [user, currentRound]);

  // Вычисление углов секторов
  const calculateSegments = useCallback(() => {
    if (!currentRound || currentRound.players.length === 0) return [];

    const segments = currentRound.players.map((player, index) => {
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

    return segments;
  }, [currentRound]);

  // Спин колеса
  const spinWheel = useCallback(() => {
    if (!currentRound || currentRound.players.length === 0) return;
    if (isSpinning) return;

    setIsSpinning(true);
    setCurrentRound(prev => prev ? { ...prev, status: 'spinning' } : prev);

    // Случайный угол для остановки
    const randomAngle = Math.random() * 360;
    const totalRotation = 3600 + randomAngle; // 10 полных оборотов + случайный угол
    setRotationAngle(totalRotation);

    // Определяем победителя через 5 секунд
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
    initRound();
  }, [initRound]);

  // Инициализация при монтировании
  useEffect(() => {
    initRound();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [initRound]);

  return {
    currentRound,
    betAmount,
    setBetAmount,
    selectedColor,
    setSelectedColor,
    isSpinning,
    rotationAngle,
    winner,
    calculateSegments,
    placeBet,
    spinWheel,
    resetRound,
    COLORS,
  };
};