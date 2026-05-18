import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk-react';

// Строгая типизация для данных пользователя Telegram
export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  isPremium: boolean;
}

// Мок-данные для тестирования вне Telegram
const MOCK_USER: TelegramUser = {
  id: 123456789,
  firstName: 'John',
  lastName: 'Doe',
  username: 'johndoe',
  photoUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
  isPremium: true,
};

export const useTelegramUser = (): { user: TelegramUser | null; isLoading: boolean } => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Попытка получить реальные данные из Telegram Mini App окружения
      const launchParams = retrieveLaunchParams();
      
      // Проверяем наличие данных пользователя через tgWebAppData
      if (launchParams.tgWebAppData?.user) {
        const tgUser = launchParams.tgWebAppData.user;
        setUser({
          id: Number(tgUser.id),
          firstName: String(tgUser.firstName || ''),
          lastName: tgUser.lastName ? String(tgUser.lastName) : undefined,
          username: tgUser.username ? String(tgUser.username) : undefined,
          photoUrl: tgUser.photoUrl ? String(tgUser.photoUrl) : undefined,
          isPremium: Boolean(tgUser.isPremium),
        });
      } else {
        // Используем мок-данные, если приложение открыто вне Telegram
        console.warn('No Telegram user found. Using mock data.');
        setUser(MOCK_USER);
      }
    } catch (error) {
      console.error('Failed to retrieve launch params:', error);
      // В случае ошибки также используем мок-данные
      setUser(MOCK_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoading };
};