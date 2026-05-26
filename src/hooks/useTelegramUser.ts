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
  id: 479243932, // ВРЕМЕННО: установлен ID админа для теста
  firstName: 'Admin',
  lastName: 'Test',
  username: 'admin',
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

  const loadUserPhoto = useCallback(async () => {
    if (!user) return;

    try {
      // @ts-ignore
      const tg = window.Telegram?.WebApp;
      
      if (tg?.initDataUnsafe?.user?.photo_url) {
        const photoUrl = tg.initDataUnsafe.user.photo_url;
        setUser(prev => prev ? { ...prev, photoUrl } : prev);
        return;
      }

      if (tg?.CloudStorage) {
        try {
          const photo = await new Promise<string | undefined>((resolve) => {
            tg.CloudStorage.getItem('user_photo', (err: Error | null, value: string | null) => {
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
        
        console.log('Launch params:', launchParams);
        
        if (launchParams.tgWebAppData?.user) {
          const tgUser = launchParams.tgWebAppData.user;
          
          // ВАЖНО: убедитесь, что id - это число
          const userId = Number(tgUser.id);
          
          console.log('Raw tgUser:', tgUser);
          console.log('User ID (number):', userId);
          console.log('Is admin check (479243932)?', userId === 479243932);
          
          const firstName = String(tgUser.firstName || '');
          const lastName = tgUser.lastName ? String(tgUser.lastName) : undefined;
          
          // Если имя пустое, используем username или "User"
          const displayName = firstName || '';
          
          let photoUrl: string | undefined;
          
          if (tgUser.photoUrl) {
            photoUrl = String(tgUser.photoUrl);
          }
          
          const userData: TelegramUser = {
            id: userId,
            firstName: displayName,
            lastName: lastName,
            username: tgUser.username ? String(tgUser.username) : undefined,
            photoUrl: photoUrl,
            isPremium: Boolean(tgUser.isPremium),
          };
          
          console.log('Created userData:', userData);
          console.log('Final admin check:', userData.id === 479243932);
          
          setUser(userData);
          
          if (!photoUrl) {
            setTimeout(() => loadUserPhoto(), 500);
          }
        } else {
          console.log('No tgWebAppData.user found, using mock admin user');
          setUser(MOCK_USER);
        }
      } catch (error) {
        console.error('Failed to retrieve launch params:', error);
        console.log('Using mock admin user due to error');
        setUser(MOCK_USER);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, [loadUserPhoto]);

  return { user, isLoading, loadUserPhoto };
};