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
  photoUrl: 'https://avatars.githubusercontent.com/u/1?v=4', // Пример аватара
  isPremium: true, // Для теста отображения звезды
};

export const useTelegramUser = (): { user: TelegramUser | null; isLoading: boolean } => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      // Попытка получить реальные данные из Telegram Mini App окружения
      const { initData } = retrieveLaunchParams();
      const telegramUser = initData?.user;

      if (telegramUser) {
        setUser({
          id: telegramUser.id,
          firstName: telegramUser.firstName,
          lastName: telegramUser.lastName,
          username: telegramUser.username,
          photoUrl: telegramUser.photoUrl,
          isPremium: telegramUser.isPremium || false,
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