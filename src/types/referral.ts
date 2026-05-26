export interface ReferralData {
  userId: number;
  referralCode: string;
  referrerId: number | null;
  referrals: ReferralUser[];
  totalEarnedTon: number;
  totalEarnedStars: number;
  createdAt: Date;
}

export interface ReferralUser {
  userId: number;
  firstName: string;
  username?: string;
  joinedAt: Date;
  earnedTon: number;
  earnedStars: number;
}

export interface ReferralReward {
  type: 'ton' | 'stars';
  amount: number;
  reason: string;
  timestamp: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnedTon: number;
  totalEarnedStars: number;
  availableTon: number;
  availableStars: number;
  claimedTon: number;
  claimedStars: number;
}