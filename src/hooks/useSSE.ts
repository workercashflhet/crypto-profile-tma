// src/hooks/useSSE.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from './useGameAPI';

export const useSSE = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 10;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      console.log('Connecting to SSE...');
      const eventSource = new EventSource('/api/game/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      // Обработка сообщений
      eventSource.onmessage = (event) => {
        try {
          // Пропускаем ping
          if (event.data.startsWith(':')) return;
          
          const data = JSON.parse(event.data);
          if (data.type === 'init' || data.type === 'update') {
            setGameState(data.data);
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      // Обработка ошибок
      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setIsConnected(false);
        
        reconnectAttempts.current += 1;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Connection lost. Please refresh the page.');
          return;
        }

        // Экспоненциальная задержка: 3s, 6s, 12s...
        const delay = Math.min(3000 * Math.pow(2, reconnectAttempts.current - 1), 30000);
        setError(`Reconnecting... (attempt ${reconnectAttempts.current})`);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };

    } catch (err) {
      console.error('Failed to connect SSE:', err);
      setError('Failed to connect to server');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    reconnectAttempts.current = 0;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    gameState,
    isConnected,
    error,
    reconnect: connect
  };
};