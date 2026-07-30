"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const redis_1 = require("../_lib/redis");
async function handler(req, res) {
    try {
        // Просто проверяем, что Redis работает
        await (0, redis_1.getGameState)();
        return res.status(200).json({
            success: true,
            message: 'pong',
            timestamp: Date.now()
        });
    }
    catch (error) {
        console.error('Ping error:', error);
        return res.status(500).json({
            success: false,
            error: 'Ping failed'
        });
    }
}
