// src/hooks/useSSE.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from './useGameAPI';

export const useSSE = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const eventSource = new EventSource('/api/game/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connected');
        setIsConnected(true);
        setError(null);
      };

      eventSource.addEventListener('game_update', (event) => {
        try {
          const data = JSON.parse(event.data);
          setGameState(data);
        } catch (err) {
          console.error('Error parsing game update:', err);
        }
      });

      eventSource.addEventListener('ping', (event) => {
        console.log('SSE ping:', event.data);
      });

      eventSource.onerror = (err) => {
        console.error('SSE error:', err);
        setIsConnected(false);
        setError('Connection lost. Reconnecting...');
        
        // Переподключение через 3 секунды
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
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
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    gameState,
    isConnected,
    error,
    reconnect: connect,
  };
};