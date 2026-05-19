import { postEvent } from '@telegram-apps/sdk-react';

interface StarsPaymentParams {
  amount: number; // Сумма в звездах
  currency: 'ton' | 'usdt';
  tonAmount: number; // Сколько TON/USDT получит пользователь
}

// Получение ссылки на инвойс через бота
export const createStarsInvoice = async (params: StarsPaymentParams): Promise<string> => {
  try {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    
    if (!tg) {
      throw new Error('Telegram WebApp not available');
    }

    // Отправляем данные в бота для создания инвойса
    const invoiceData = {
      title: `Deposit ${params.tonAmount} ${params.currency.toUpperCase()}`,
      description: `Get ${params.tonAmount} ${params.currency.toUpperCase()} on your game balance`,
      payload: JSON.stringify({
        type: 'deposit',
        currency: params.currency,
        amount: params.tonAmount,
        userId: tg.initDataUnsafe?.user?.id,
      }),
      currency: 'XTR', // Звезды Telegram
      prices: [{
        label: `${params.amount} Stars`,
        amount: params.amount,
      }],
    };

    // Возвращаем данные для создания инвойса
    // В реальном приложении здесь должен быть запрос к вашему бэкенду
    return JSON.stringify(invoiceData);
  } catch (error) {
    console.error('Error creating stars invoice:', error);
    throw error;
  }
};

// Проверка оплаты (должна вызываться с бэкенда)
export const verifyStarsPayment = async (payload: string): Promise<boolean> => {
  try {
    const data = JSON.parse(payload);
    
    if (data.type === 'deposit' && data.amount > 0) {
      // В реальном приложении - проверка через Telegram API
      // Сейчас возвращаем true для теста
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};