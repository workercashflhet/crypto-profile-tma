"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const redis_1 = require("../_lib/redis");
async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    // GET - получение баланса
    if (req.method === 'GET') {
        try {
            const userId = parseInt(req.query.userId);
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'userId is required'
                });
            }
            const balance = await (0, redis_1.getPlayerBalance)(userId);
            return res.status(200).json({
                success: true,
                data: balance
            });
        }
        catch (error) {
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
                balance = await (0, redis_1.updatePlayerBalance)(userId, tonDelta, starsDelta);
            }
            else if (action === 'withdraw') {
                const tonDelta = currency === 'ton' ? -amount : 0;
                const starsDelta = currency === 'stars' ? -amount : 0;
                balance = await (0, redis_1.updatePlayerBalance)(userId, tonDelta, starsDelta);
            }
            else {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid action'
                });
            }
            return res.status(200).json({
                success: true,
                data: balance
            });
        }
        catch (error) {
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
