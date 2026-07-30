// api/user/balance.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPlayerBalance, setPlayerBalance, updatePlayerBalance } from '../_lib/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - получение баланса
  if (req.method === 'GET') {
    try {
      const userId = parseInt(req.query.userId as string);
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }

      const balance = await getPlayerBalance(userId);
      return res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('Error getting balance:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get balance'
      });
    }
  }

  // POST - обновление баланса
  if (req.method === 'POST') {
    try {
      const { userId, action, currency, amount } = req.body;

      if (!userId || !action || !currency || amount === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      let balance;
      if (action === 'deposit') {
        const tonDelta = currency === 'ton' ? amount : 0;
        const starsDelta = currency === 'stars' ? amount : 0;
        balance = await updatePlayerBalance(userId, tonDelta, starsDelta);
      } else if (action === 'withdraw') {
        const tonDelta = currency === 'ton' ? -amount : 0;
        const starsDelta = currency === 'stars' ? -amount : 0;
        balance = await updatePlayerBalance(userId, tonDelta, starsDelta);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
      }

      return res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('Error updating balance:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update balance'
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}