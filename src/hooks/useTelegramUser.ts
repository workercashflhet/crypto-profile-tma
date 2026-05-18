import { useEffect, useState, useCallback } from 'react';
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

export const useTelegramUser = (): { 
  user: TelegramUser | null; 
  isLoading: boolean;
  loadUserPhoto: () => Promise<void>;
} => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Функция для загрузки фото через Telegram Web App API
  const loadUserPhoto = useCallback(async () => {
    if (!user) return;

    try {
      // @ts-ignore - Telegram WebApp API
      const tg = window.Telegram?.WebApp;
      
      if (tg?.initDataUnsafe?.user?.photo_url) {
        // Используем photo_url из initDataUnsafe
        const photoUrl = tg.initDataUnsafe.user.photo_url;
        setUser(prev => prev ? { ...prev, photoUrl } : prev);
        return;
      }

      // Альтернативный способ через CloudStorage
      if (tg?.CloudStorage) {
        try {
          const photo = await new Promise<string | undefined>((resolve) => {
            tg.CloudStorage.getItem('user_photo', (err, value) => {
              if (!err && value) resolve(value);
              else resolve(undefined);
            });
          });
          
          if (photo) {
            setUser(prev => prev ? { ...prev, photoUrl: photo } : prev);
            return;
          }
        } catch (e) {
          console.log('CloudStorage not available');
        }
      }

      // Если API недоступен, пробуем стандартный URL
      const photoUrl = `https://t.me/i/userpic/320/${user.id}.jpg`;
      setUser(prev => prev ? { ...prev, photoUrl } : prev);
    } catch (error) {
      console.error('Error loading user photo:', error);
      const photoUrl = `https://t.me/i/userpic/320/${user.id}.jpg`;
      setUser(prev => prev ? { ...prev, photoUrl } : prev);
    }
  }, [user?.id]);

  useEffect(() => {
    const initUser = async () => {
      try {
        const launchParams = retrieveLaunchParams();
        
        if (launchParams.tgWebAppData?.user) {
          const tgUser = launchParams.tgWebAppData.user;
          const userId = Number(tgUser.id);
          
          // Пытаемся получить фото из tgWebAppData
          let photoUrl: string | undefined;
          
          if (tgUser.photoUrl) {
            photoUrl = String(tgUser.photoUrl);
          }
          
          const userData: TelegramUser = {
            id: userId,
            firstName: String(tgUser.firstName || 'User'),
            lastName: tgUser.lastName ? String(tgUser.lastName) : undefined,
            username: tgUser.username ? String(tgUser.username) : undefined,
            photoUrl: photoUrl,
            isPremium: Boolean(tgUser.isPremium),
          };
          
          setUser(userData);
          
          // Если фото не загрузилось, пробуем альтернативные способы
          if (!photoUrl) {
            setTimeout(() => loadUserPhoto(), 500);
          }
        } else {
          setUser(MOCK_USER);
        }
      } catch (error) {
        console.error('Failed to retrieve launch params:', error);
        setUser(MOCK_USER);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, [loadUserPhoto]);

  return { user, isLoading, loadUserPhoto };
};