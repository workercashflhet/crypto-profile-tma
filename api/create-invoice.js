// api/create-invoice.js
export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('BOT_TOKEN not configured');
      return res.status(500).json({ error: 'Bot token not configured' });
    }

    // Делаем прямой запрос к Telegram API без библиотек
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Deposit Stars',
        description: `${amount} Stars to game balance`,
        payload: JSON.stringify({ amount, type: 'stars_deposit' }),
        currency: 'XTR',
        prices: [{ label: `${amount} Stars`, amount: Math.floor(amount) }],
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ 
        error: 'Failed to create invoice',
        details: data.description 
      });
    }

    return res.status(200).json({ 
      success: true,
      invoiceLink: data.result 
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}