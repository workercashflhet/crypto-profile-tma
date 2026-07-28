// src/pages/NewPvPGame.tsx
import React, { useState, useEffect } from 'react';
import { useGameAPI } from '../hooks/useGameAPI';
import { useGameBalance } from '../hooks/useGameBalance';
import LuckyWheel from '../components/LuckyWheel';
import './NewPvPGame.css';

const BALL_OPTIONS = [
  { value: 1, price: 0.30 },
  { value: 5, price: 1.50 },
  { value: 10, price: 3.00 },
  { value: 50, price: 15 },
  { value: 100, price: 30 },
  { value: 500, price: 150 },
];

export const NewPvPGame: React.FC = () => {
  const { gameState, isLoading, error, placeBet, spinWheel, resetGame } = useGameAPI();
  const { balance, withdrawTon, withdrawStars, depositTon, depositStars } = useGameBalance();
  
  const [betAmount, setBetAmount] = useState<number>(1);
  const [selectedCurrency, setSelectedCurrency] = useState<'ton' | 'stars'>('ton');
  const [selectedBalls, setSelectedBalls] = useState<number>(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  // Эффект для автоматического вращения
  useEffect(() => {
    if (gameState?.status === 'spinning' && !isSpinning) {
      setIsSpinning(true);
      // Симулируем вращение
      const spinDuration = 5000;
      const targetAngle = 360 * 8 + Math.random() * 360;
      setRotationAngle(targetAngle);
      
      setTimeout(() => {
        setIsSpinning(false);
        // После вращения обновляем состояние
        spinWheel();
      }, spinDuration);
    }
  }, [gameState?.status, isSpinning, spinWheel]);

  // Автоматический сброс после завершения
  useEffect(() => {
    if (gameState?.status === 'finished') {
      const timeout = setTimeout(() => {
        resetGame();
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.status, resetGame]);

  const handlePlaceBet = async () => {
    if (!gameState) {
      setLocalError('Game not available');
      return;
    }

    if (gameState.status === 'spinning' || gameState.status === 'finished') {
      setLocalError('Game is not active');
      return;
    }

    if (betAmount <= 0) {
      setLocalError('Amount must be greater than 0');
      return;
    }

    // Проверяем баланс
    if (selectedCurrency === 'ton') {
      if (balance.ton < betAmount) {
        setLocalError(`Insufficient TON balance. You have ${balance.ton.toFixed(1)} TON`);
        return;
      }
      withdrawTon(betAmount);
    } else {
      if (balance.stars < betAmount) {
        setLocalError(`Insufficient Stars balance. You have ${balance.stars.toFixed(0)} Stars`);
        return;
      }
      withdrawStars(betAmount);
    }

    // Отправляем ставку на сервер
    const success = await placeBet(betAmount, selectedCurrency);
    
    if (success) {
      setLocalError(null);
      // Сбрасываем ошибку через 3 секунды
      setTimeout(() => setLocalError(null), 3000);
    } else {
      // Возвращаем средства при ошибке
      if (selectedCurrency === 'ton') {
        depositTon(betAmount);
      } else {
        depositStars(betAmount);
      }
    }
  };

  const formatPool = () => {
    if (!gameState) return '0';
    
    const parts: React.ReactNode[] = [];
    
    if (gameState.totalPoolTon > 0) {
      parts.push(<span key="ton">{gameState.totalPoolTon} TON</span>);
    }
    
    if (gameState.totalPoolStars > 0) {
      parts.push(
        <span key="stars" className="pool-stars">
          {gameState.totalPoolStars}
          <img src="/stars.png" alt="Stars" className="pool-star-icon" />
        </span>
      );
    }
    
    if (parts.length === 0) return '0';
    if (parts.length === 1) return parts[0];
    
    return (
      <span className="pool-display">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && <span className="pool-plus"> + </span>}
          </React.Fragment>
        ))}
      </span>
    );
  };

  const getStatusText = () => {
    if (!gameState) return 'Loading...';
    switch (gameState.status) {
      case 'spinning': return '🎰 Spinning...';
      case 'finished': return '🏆 Round Finished!';
      case 'waiting': return '⏳ Waiting for players';
      case 'active': return '🎮 Game in progress';
      default: return 'Loading...';
    }
  };

  const getStatusDotClass = () => {
    if (!gameState) return 'waiting';
    return gameState.status;
  };

  // Проверка, можно ли делать ставку
  const canPlaceBet = (): boolean => {
    if (!gameState) return false;
    return gameState.status !== 'finished' && gameState.status !== 'spinning';
  };

  const maxBet = selectedCurrency === 'ton' ? balance.ton : balance.stars;
  const displayError = error || localError;

  if (isLoading) {
    return <div className="new-pvp-page">Loading game...</div>;
  }

  return (
    <div className="new-pvp-page">
      {/* Balance */}
      <div className="pvp-balance card">
        <div className="balance-row">
          <div 
            className={`balance-item ${selectedCurrency === 'ton' ? 'active' : ''}`}
            onClick={() => setSelectedCurrency('ton')}
          >
            <span className="balance-label">TON</span>
            <span className="balance-value">{balance.ton.toFixed(1)}</span>
          </div>
          <div className="balance-divider" />
          <div 
            className={`balance-item ${selectedCurrency === 'stars' ? 'active' : ''}`}
            onClick={() => setSelectedCurrency('stars')}
          >
            <span className="balance-label">Stars</span>
            <span className="balance-value">{balance.stars.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {displayError && <div className="error-message">{displayError}</div>}

      {/* Wheel */}
      <div className="wheel-wrapper">
        <LuckyWheel 
          segments={gameState?.players.map(p => ({
            color: p.color,
            percentage: 0,
            player: p,
            startAngle: 0,
            endAngle: 360,
          })) || []} 
          rotationAngle={rotationAngle} 
          isSpinning={isSpinning}
          timeLeft={gameState?.timeLeft || 0}
        />
      </div>

      {/* Status */}
      <div className="pvp-status card">
        <div className={`status-indicator ${getStatusDotClass()}`}>
          <span className="status-dot" />
          <span className="status-text">{getStatusText()}</span>
        </div>
        <div className="status-info">
          <div className="info-item">
            <span className="info-label">Prize pool</span>
            <span className="info-value">{formatPool()}</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">Players</span>
            <span className="info-value">{gameState?.players.length || 0}</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">Round</span>
            <span className="info-value">#{gameState?.roundNumber || '----'}</span>
          </div>
        </div>
      </div>

      {/* Bet Section */}
      {canPlaceBet() && (
        <div className="bet-section card">
          <div className="currency-toggle">
            <button
              className={`currency-btn ${selectedCurrency === 'ton' ? 'active' : ''}`}
              onClick={() => setSelectedCurrency('ton')}
            >
              <img src="/ton.png" alt="TON" className="currency-icon" />
              TON
            </button>
            <button
              className={`currency-btn ${selectedCurrency === 'stars' ? 'active' : ''}`}
              onClick={() => setSelectedCurrency('stars')}
            >
              <img src="/stars.png" alt="Stars" className="currency-icon" />
              Stars
            </button>
          </div>

          <div className="bet-input-group">
            <input
              type="number"
              className="bet-input"
              value={betAmount || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') setBetAmount(0);
                else {
                  const parsed = parseInt(value.replace(/^0+/, ''), 10);
                  if (!isNaN(parsed)) setBetAmount(parsed);
                }
              }}
              placeholder="Enter amount"
              min="1"
              max={maxBet}
            />
            <button 
              className="btn-primary play-btn"
              onClick={handlePlaceBet}
              disabled={betAmount > maxBet || betAmount <= 0 || !canPlaceBet()}
            >
              Play
            </button>
          </div>

          <div className="ball-options">
            {BALL_OPTIONS.map((option) => (
              <button
                key={option.value}
                className={`ball-option ${selectedBalls === option.value ? 'active' : ''}`}
                onClick={() => {
                  setSelectedBalls(option.value);
                  setBetAmount(option.value);
                }}
              >
                <span className="ball-number">{option.value}</span>
                <span className="ball-price">{option.price} USDT</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Winner */}
      {gameState?.winner && (
        <div className="winner-section card">
          <div className="winner-avatar">
            {gameState.winner.avatar ? (
              <img src={gameState.winner.avatar} alt={gameState.winner.firstName} />
            ) : (
              <span className="winner-emoji">👑</span>
            )}
          </div>
          <div className="winner-info">
            <span className="winner-name">{gameState.winner.firstName} wins!</span>
            <span className="winner-prize">{formatPool()}</span>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="players-list card">
        <h3>🎮 Players</h3>
        {gameState?.players.map((player, index) => (
          <div key={index} className="player-item">
            <div className="player-color" style={{ backgroundColor: player.color }} />
            <span className="player-name">{player.firstName}</span>
            <span className="player-bet">
              {player.bets.map(b => `${b.amount} ${b.currency}`).join(' + ')}
            </span>
          </div>
        ))}
        {(!gameState?.players || gameState.players.length === 0) && (
          <div className="no-players">No players yet. Be the first!</div>
        )}
      </div>
    </div>
  );
};