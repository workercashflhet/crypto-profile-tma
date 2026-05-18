import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isPremium: boolean;
}

const MOCK_USER: TelegramUser = {
  id: 123456789,
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  photoUrl: undefined,
  isPremium: true,
};

export const useTelegramUser = (): { user: TelegramUser | null; isLoading: boolean } => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const launchParams = retrieveLaunchParams();
      
      if (launchParams.tgWebAppData?.user) {
        const tgUser = launchParams.tgWebAppData.user;
        
        // Формируем URL фото профиля
        let photoUrl: string | undefined;
        
        if (tgUser.photoUrl) {
          photoUrl = String(tgUser.photoUrl);
        } else if (tgUser.id) {
          // Используем стандартный URL фото Telegram
          photoUrl = `https://t.me/i/userpic/320/${tgUser.id}.jpg`;
        }
        
        const userData: TelegramUser = {
          id: Number(tgUser.id),
          firstName: String(tgUser.firstName || 'User'),
          lastName: tgUser.lastName ? String(tgUser.lastName) : undefined,
          username: tgUser.username ? String(tgUser.username) : undefined,
          photoUrl: photoUrl,
          isPremium: Boolean(tgUser.isPremium),
        };
        
        setUser(userData);
      } else {
        console.warn('No Telegram user found. Using mock data.');
        setUser(MOCK_USER);
      }
    } catch (error) {
      console.error('Failed to retrieve launch params:', error);
      setUser(MOCK_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading };
};