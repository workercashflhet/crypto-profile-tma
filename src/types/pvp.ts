export interface PvPPlayer {
  userId: number;
  username: string;
  firstName: string;
  avatar?: string;
  bet: number;
  color: 'blue' | 'pink' | 'cyan';
}

export interface PvPRound {
  id: string;
  players: PvPPlayer[];
  totalPool: number;
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