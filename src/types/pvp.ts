export type CurrencyType = 'ton' | 'usdt';

export interface PvPPlayer {
  userId: number;
  username: string;
  firstName: string;
  avatar?: string;
  bets: PlayerBet[]; // Теперь массив ставок
  totalBet: number; // Общая сумма ставок
  currency: CurrencyType; // Валюта ставки
  color: string;
}

export interface PlayerBet {
  amount: number;
  currency: CurrencyType;
  timestamp: number;
}

export interface PvPRound {
  id: string;
  players: PvPPlayer[];
  totalPoolTon: number;
  totalPoolUsdt: number;
  timeLeft: number;
  status: 'waiting' | 'active' | 'spinning' | 'finished';
  winner?: PvPPlayer;
  timestamp: number;
}

export interface WheelSegment {
  color: string;
  percentage: number;
  player: PvPPlayer;
  startAngle: number;
  endAngle: number;
}