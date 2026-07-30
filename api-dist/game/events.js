"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const redis_1 = require("../_lib/redis");
async function handler(req, res) {
    // Настройка SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    // Отправляем начальное состояние
    const initialState = await (0, redis_1.getGameState)();
    if (initialState) {
        res.write(`data: ${JSON.stringify({ type: 'init', data: initialState })}\n\n`);
    }
    let isClosed = false;
    let lastState = initialState;
    req.on('close', () => {
        isClosed = true;
        clearInterval(pingInterval);
        clearInterval(updateInterval);
        clearInterval(heartbeatInterval);
    });
    // ✅ Пинг каждые 5 секунд (держит соединение живым)
    const pingInterval = setInterval(() => {
        if (!isClosed) {
            res.write(`: ping ${Date.now()}\n\n`);
        }
    }, 5000);
    // ✅ Проверка обновлений каждую секунду
    const updateInterval = setInterval(async () => {
        if (isClosed)
            return;
        try {
            const currentState = await (0, redis_1.getGameState)();
            if (JSON.stringify(currentState) !== JSON.stringify(lastState)) {
                lastState = currentState;
                if (currentState) {
                    res.write(`data: ${JSON.stringify({ type: 'update', data: currentState })}\n\n`);
                }
            }
        }
        catch (error) {
            console.error('Error updating SSE:', error);
        }
    }, 1000);
    // Отправляем heartbeat каждые 25 секунд (запасной вариант)
    const heartbeatInterval = setInterval(() => {
        if (!isClosed) {
            res.write(`: heartbeat\n\n`);
        }
    }, 25000);
}
