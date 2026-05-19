// api/create-invoice.js
// Эта функция будет доступна по адресу: https://ваш-домен.vercel.app/api/create-invoice

const { Bot } = require('grammy');

// Инициализируем бота с токеном из переменных окружения
const bot = new Bot(process.env.BOT_TOKEN);

module.exports = async (req, res) => {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Создаем ссылку на инвойс через Telegram API
    const invoiceLink = await bot.api.createInvoiceLink({
      title: 'Deposit Stars',
      description: `${amount} Stars to game balance`,
      payload: JSON.stringify({ 
        amount: amount, 
        type: 'stars_deposit',
        timestamp: Date.now()
      }),
      currency: 'XTR', // Код валюты Telegram Stars
      prices: [{ 
        label: `${amount} Stars`, 
        amount: Math.floor(amount) 
      }],
    });

    // Отправляем ссылку обратно на фронтенд
    res.status(200).json({ 
      success: true,
      invoiceLink: invoiceLink 
    });

  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create invoice',
      details: error.message 
    });
  }
};