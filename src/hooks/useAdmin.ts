import { useState, useEffect, useCallback } from 'react';
import { useTelegramUser } from './useTelegramUser';
import { AdminAction, GameSettings } from '../types/admin';

const ADMIN_ID = 479243932;
const USER_BALANCES_KEY = 'user_balances_v1';
const ADMIN_ACTIONS_KEY = 'admin_actions_v1';
const GAME_SETTINGS_KEY = 'game_settings_v1';

interface UserBalanceData {
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
  lastActive: string;
}

export const useAdmin = () => {
  const { user } = useTelegramUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserBalanceData[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    roundDuration: 30,
    minBet: 1,
    maxBet: 1000,
    autoResetDelay: 10000,
    tonToStarsRate: 76,
    withdrawalEnabled: true,
    depositEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Проверка является ли пользователь администратором
  useEffect(() => {
    if (user) {
      setIsAdmin(user.id === ADMIN_ID);
    }
  }, [user]);

  // Загрузка всех пользователей
  const loadAllUsers = useCallback(() => {
    try {
      const stored = localStorage.getItem(USER_BALANCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUsers(parsed);
      } else {
        const initialUsers: UserBalanceData[] = [];
        setUsers(initialUsers);
        localStorage.setItem(USER_BALANCES_KEY, JSON.stringify(initialUsers));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }, []);

  // Загрузка действий администратора
  const loadAdminActions = useCallback(() => {
    try {
      const stored = localStorage.getItem(ADMIN_ACTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setActions(parsed.map((a: any) => ({ ...a, timestamp: new Date(a.timestamp) })));
      }
    } catch (error) {
      console.error('Error loading actions:', error);
    }
  }, []);

  // Загрузка настроек игры
  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(GAME_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // Сохранение настроек
  const saveSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(newSettings));
    
    // Логируем действие
    if (user && isAdmin) {
      const action: AdminAction = {
        id: Date.now().toString(),
        adminId: user.id,
        action: 'update_settings' as any, // Используем as any для обхода проверки типа
        targetUserId: 0,
        timestamp: new Date(),
      };
      const updatedActions = [action, ...actions];
      setActions(updatedActions);
      localStorage.setItem(ADMIN_ACTIONS_KEY, JSON.stringify(updatedActions));
    }
  }, [user, isAdmin, actions]);

  // Обновление баланса пользователя
  const updateUserBalance = useCallback((
    userId: number,
    username: string,
    firstName: string,
    tonDelta: number,
    starsDelta: number,
    actionType: AdminAction['action'],
    reason?: string
  ) => {
    if (!isAdmin) return false;

    setUsers(prev => {
      const existingUserIndex = prev.findIndex(u => u.userId === userId);
      let updatedUsers: UserBalanceData[];
      
      if (existingUserIndex >= 0) {
        updatedUsers = prev.map((u, i) => {
          if (i === existingUserIndex) {
            const newTonBalance = Math.max(0, u.tonBalance + tonDelta);
            const newStarsBalance = Math.max(0, u.starsBalance + starsDelta);
            
            const updatedUser = {
              ...u,
              tonBalance: newTonBalance,
              starsBalance: newStarsBalance,
              totalDepositedTon: tonDelta > 0 ? u.totalDepositedTon + tonDelta : u.totalDepositedTon,
              totalDepositedStars: starsDelta > 0 ? u.totalDepositedStars + starsDelta : u.totalDepositedStars,
              totalWithdrawnTon: tonDelta < 0 ? u.totalWithdrawnTon + Math.abs(tonDelta) : u.totalWithdrawnTon,
              totalWithdrawnStars: starsDelta < 0 ? u.totalWithdrawnStars + Math.abs(starsDelta) : u.totalWithdrawnStars,
              lastActive: new Date().toISOString(),
            };
            
            // Обновляем игровой баланс пользователя в localStorage
            const gameBalanceKey = `game_balance_v4_${userId}`;
            const stored = localStorage.getItem(gameBalanceKey);
            if (stored) {
              const balance = JSON.parse(stored);
              balance.ton = newTonBalance;
              balance.stars = newStarsBalance;
              localStorage.setItem(gameBalanceKey, JSON.stringify(balance));
            }
            
            return updatedUser;
          }
          return u;
        });
      } else {
        const newUser: UserBalanceData = {
          userId,
          username,
          firstName,
          tonBalance: Math.max(0, tonDelta),
          starsBalance: Math.max(0, starsDelta),
          totalDepositedTon: tonDelta > 0 ? tonDelta : 0,
          totalDepositedStars: starsDelta > 0 ? starsDelta : 0,
          totalWithdrawnTon: tonDelta < 0 ? Math.abs(tonDelta) : 0,
          totalWithdrawnStars: starsDelta < 0 ? Math.abs(starsDelta) : 0,
          totalBets: 0,
          totalWins: 0,
          lastActive: new Date().toISOString(),
        };
        updatedUsers = [...prev, newUser];
        
        // Создаем баланс для нового пользователя
        const gameBalanceKey = `game_balance_v4_${userId}`;
        localStorage.setItem(gameBalanceKey, JSON.stringify({
          ton: Math.max(0, tonDelta),
          stars: Math.max(0, starsDelta),
        }));
      }
      
      localStorage.setItem(USER_BALANCES_KEY, JSON.stringify(updatedUsers));
      
      // Логируем действие
      const action: AdminAction = {
        id: Date.now().toString(),
        adminId: user!.id,
        action: actionType,
        targetUserId: userId,
        amount: tonDelta !== 0 ? tonDelta : starsDelta,
        currency: tonDelta !== 0 ? 'ton' : 'stars',
        reason,
        timestamp: new Date(),
      };
      const updatedActions = [action, ...actions];
      setActions(updatedActions);
      localStorage.setItem(ADMIN_ACTIONS_KEY, JSON.stringify(updatedActions));
      
      return updatedUsers;
    });
    
    return true;
  }, [isAdmin, user, actions]);

  // Получение статистики
  const getStats = useCallback(() => {
    const totalUsers = users.length;
    const totalTonInGame = users.reduce((sum, u) => sum + u.tonBalance, 0);
    const totalStarsInGame = users.reduce((sum, u) => sum + u.starsBalance, 0);
    const totalDepositedTon = users.reduce((sum, u) => sum + u.totalDepositedTon, 0);
    const totalDepositedStars = users.reduce((sum, u) => sum + u.totalDepositedStars, 0);
    const totalWithdrawnTon = users.reduce((sum, u) => sum + u.totalWithdrawnTon, 0);
    const totalWithdrawnStars = users.reduce((sum, u) => sum + u.totalWithdrawnStars, 0);
    const totalBets = users.reduce((sum, u) => sum + u.totalBets, 0);
    const totalWins = users.reduce((sum, u) => sum + u.totalWins, 0);
    
    return {
      totalUsers,
      totalTonInGame,
      totalStarsInGame,
      totalDepositedTon,
      totalDepositedStars,
      totalWithdrawnTon,
      totalWithdrawnStars,
      totalBets,
      totalWins,
    };
  }, [users]);

  // Инициализация
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
      loadAdminActions();
      loadSettings();
    }
    setIsLoading(false);
  }, [isAdmin, loadAllUsers, loadAdminActions, loadSettings]);

  return {
    isAdmin,
    users,
    actions,
    settings,
    setSettings,
    isLoading,
    updateUserBalance,
    saveSettings,
    getStats,
    loadAllUsers,
  };
};