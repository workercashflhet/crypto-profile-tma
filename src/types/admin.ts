export interface AdminUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  isAdmin: boolean;
}

export interface UserBalance {
  userId: number;
  username: string;
  firstName: string;
  tonBalance: number;
  starsBalance: number;
  totalDepositedTon: number;
  totalDepositedStars: number;
  totalWithdrawnTon: number;
  totalWithdrawnStars: number;
  totalBets: number;
  totalWins: number;
  lastActive: Date;
}

export interface AdminAction {
  id: string;
  adminId: number;
  action: 'add_balance' | 'remove_balance' | 'reset_balance' | 'ban_user' | 'unban_user';
  targetUserId: number;
  amount?: number;
  currency?: 'ton' | 'stars';
  reason?: string;
  timestamp: Date;
}

export interface GameSettings {
  roundDuration: number;
  minBet: number;
  maxBet: number;
  autoResetDelay: number;
  tonToStarsRate: number;
  withdrawalEnabled: boolean;
  depositEnabled: boolean;
}