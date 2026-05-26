import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';
import { ReferralData, ReferralUser, ReferralStats } from '../types/referral';

const REFERRAL_STORAGE_KEY = 'referral_data_v1';
const REFERRAL_CODE_PREFIX = 'CRYPTO';
const REFERRAL_LEVELS = [10, 5, 2]; // 10%, 5%, 2% для трех уровней

export const useReferral = () => {
  const { user } = useTelegramUser();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');

  // Генерация уникального реферального кода
  const generateReferralCode = useCallback((userId: number): string => {
    const hash = Math.abs(userId * 2654435761) % 1000000;
    return `${REFERRAL_CODE_PREFIX}${hash}`;
  }, []);

  // Загрузка реферальных данных
  const loadReferralData = useCallback(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(`${REFERRAL_STORAGE_KEY}_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setReferralData({
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          referrals: parsed.referrals.map((r: any) => ({
            ...r,
            joinedAt: new Date(r.joinedAt)
          }))
        });
      } else {
        // Создаем новые реферальные данные
        const newReferralData: ReferralData = {
          userId: user.id,
          referralCode: generateReferralCode(user.id),
          referrerId: null,
          referrals: [],
          totalEarnedTon: 0,
          totalEarnedStars: 0,
          createdAt: new Date(),
        };
        setReferralData(newReferralData);
        localStorage.setItem(`${REFERRAL_STORAGE_KEY}_${user.id}`, JSON.stringify(newReferralData));
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  }, [user, generateReferralCode]);

  // Регистрация реферала
  const registerReferral = useCallback((referralCode: string, newUserId: number, firstName: string, username?: string) => {
    // Находим пригласившего пользователя по коду
    const allKeys = Object.keys(localStorage);
    let referrerId: number | null = null;
    
    for (const key of allKeys) {
      if (key.startsWith(REFERRAL_STORAGE_KEY)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.referralCode === referralCode) {
            referrerId = data.userId;
            break;
          }
        }
      }
    }

    if (!referrerId) return false;

    // Обновляем данные пригласившего
    const referrerKey = `${REFERRAL_STORAGE_KEY}_${referrerId}`;
    const referrerStored = localStorage.getItem(referrerKey);
    if (referrerStored) {
      const referrerData = JSON.parse(referrerStored);
      
      const newReferral: ReferralUser = {
        userId: newUserId,
        firstName,
        username,
        joinedAt: new Date(),
        earnedTon: 0,
        earnedStars: 0,
      };
      
      referrerData.referrals.push(newReferral);
      localStorage.setItem(referrerKey, JSON.stringify(referrerData));
      
      // Обновляем состояние если это текущий пользователь
      if (referrerId === user?.id) {
        setReferralData(referrerData);
      }
    }

    // Обновляем данные нового пользователя
    const newUserKey = `${REFERRAL_STORAGE_KEY}_${newUserId}`;
    const newUserStored = localStorage.getItem(newUserKey);
    if (newUserStored) {
      const newUserData = JSON.parse(newUserStored);
      newUserData.referrerId = referrerId;
      localStorage.setItem(newUserKey, JSON.stringify(newUserData));
    }

    return true;
  }, [user]);

  // Начисление реферального вознаграждения
  const addReferralReward = useCallback((
    userId: number,
    betAmount: number,
    currency: 'ton' | 'stars'
  ) => {
    // Получаем данные пользователя
    const userKey = `${REFERRAL_STORAGE_KEY}_${userId}`;
    const userStored = localStorage.getItem(userKey);
    if (!userStored) return;

    let currentUserId = userId;
    let level = 0;

    // Начисляем вознаграждение по цепочке (до 3 уровней)
    while (currentUserId && level < REFERRAL_LEVELS.length) {
      const currentUserKey = `${REFERRAL_STORAGE_KEY}_${currentUserId}`;
      const currentUserStored = localStorage.getItem(currentUserKey);
      if (!currentUserStored) break;

      const currentUserData = JSON.parse(currentUserStored);
      const referrerId = currentUserData.referrerId;
      
      if (!referrerId) break;

      // Находим пригласившего
      const referrerKey = `${REFERRAL_STORAGE_KEY}_${referrerId}`;
      const referrerStored = localStorage.getItem(referrerKey);
      if (!referrerStored) break;

      const referrerData = JSON.parse(referrerStored);
      const rewardPercent = REFERRAL_LEVELS[level];
      const rewardAmount = (betAmount * rewardPercent) / 100;

      // Начисляем вознаграждение
      if (currency === 'ton') {
        referrerData.totalEarnedTon += rewardAmount;
        // Находим реферала и обновляем его earned
        const referralIndex = referrerData.referrals.findIndex((r: any) => r.userId === currentUserId);
        if (referralIndex !== -1) {
          referrerData.referrals[referralIndex].earnedTon += rewardAmount;
        }
      } else {
        referrerData.totalEarnedStars += rewardAmount;
        const referralIndex = referrerData.referrals.findIndex((r: any) => r.userId === currentUserId);
        if (referralIndex !== -1) {
          referrerData.referrals[referralIndex].earnedStars += rewardAmount;
        }
      }

      localStorage.setItem(referrerKey, JSON.stringify(referrerData));
      
      // Обновляем состояние если это текущий пользователь
      if (referrerId === user?.id) {
        setReferralData(referrerData);
      }
      
      currentUserId = referrerId;
      level++;
    }
  }, [user]);

  // Получение статистики
  const getReferralStats = useCallback((): ReferralStats => {
    if (!referralData) {
      return {
        totalReferrals: 0,
        totalEarnedTon: 0,
        totalEarnedStars: 0,
        availableTon: 0,
        availableStars: 0,
        claimedTon: 0,
        claimedStars: 0,
      };
    }

    return {
      totalReferrals: referralData.referrals.length,
      totalEarnedTon: referralData.totalEarnedTon,
      totalEarnedStars: referralData.totalEarnedStars,
      availableTon: referralData.totalEarnedTon,
      availableStars: referralData.totalEarnedStars,
      claimedTon: 0,
      claimedStars: 0,
    };
  }, [referralData]);

  // Формирование реферальной ссылки
  const getReferralLink = useCallback(() => {
    if (!referralData) return '';
    const botUsername = 'YOUR_BOT_USERNAME'; // Замените на username вашего бота
    return `https://t.me/${botUsername}?start=${referralData.referralCode}`;
  }, [referralData]);

  // Инициализация
  useEffect(() => {
    if (user) {
      loadReferralData();
    }
    setIsLoading(false);
  }, [user, loadReferralData]);

  useEffect(() => {
    if (referralData) {
      setReferralCode(referralData.referralCode);
      setReferralLink(getReferralLink());
    }
  }, [referralData, getReferralLink]);

  return {
    referralData,
    referralCode,
    referralLink,
    isLoading,
    registerReferral,
    addReferralReward,
    getReferralStats,
    loadReferralData,
  };
};