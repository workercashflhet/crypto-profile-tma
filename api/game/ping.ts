// api/game/ping.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { getGameState } from '../_lib/redis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Просто проверяем, что Redis работает
    await getGameState();
    return res.status(200).json({
      success: true,
      message: 'pong',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Ping error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ping failed'
    });
  }
}