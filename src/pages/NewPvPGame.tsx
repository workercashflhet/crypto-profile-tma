// src/pages/NewPvPGame.tsx
import React, { useState, useEffect } from 'react';
import { usePvPGame } from '../hooks/usePvPGame';
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
  const {
    currentRound,
    betAmount,
    setBetAmount,
    selectedCurrency,
    setSelectedCurrency,
    isSpinning,
    rotationAngle,
    winner,
    error,
    balance,
    calculateSegments,
    placeBet,
    spinWheel,
    // getTotalPool - убираем, так как не используем
  } = usePvPGame();

  const segments = calculateSegments();

  useEffect(() => {
    if (currentRound?.status === 'spinning' && currentRound.players.length > 0 && !isSpinning) {
      spinWheel();
    }
  }, [currentRound?.status, isSpinning, spinWheel]);

  const [selectedBalls, setSelectedBalls] = useState<number>(1);

  const handlePlaceBet = () => {
    placeBet(betAmount, selectedCurrency);
  };

  const maxBet = selectedCurrency === 'ton' ? balance.ton : balance.stars;

  // Функция для форматирования пула с иконками
  const formatPool = () => {
    if (!currentRound) return '0';
    const parts: string[] = [];
    if (currentRound.totalPoolTon > 0) {
      parts.push(`${currentRound.totalPoolTon} TON`);
    }
    if (currentRound.totalPoolStars > 0) {
      parts.push(`${currentRound.totalPoolStars} ⭐`);
    }
    return parts.join(' + ') || '0';
  };

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
      {error && <div className="error-message">{error}</div>}

      {/* Wheel */}
      <div className="wheel-wrapper">
        <LuckyWheel 
          segments={segments} 
          rotationAngle={rotationAngle} 
          isSpinning={isSpinning}
          timeLeft={currentRound?.timeLeft || 0}
        />
      </div>

      {/* Status */}
      <div className="pvp-status card">
        <div className={`status-indicator ${currentRound?.status || 'waiting'}`}>
          <span className="status-dot" />
          <span className="status-text">
            {currentRound?.status === 'spinning' && '🎰 Spinning...'}
            {currentRound?.status === 'finished' && '🏆 Round Finished!'}
            {currentRound?.status === 'waiting' && '⏳ Waiting for players'}
            {currentRound?.status === 'active' && '🎮 Game in progress'}
          </span>
        </div>
        <div className="status-info">
          <div className="info-item">
            <span className="info-label">Prize pool</span>
            <span className="info-value">{formatPool()}</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">Players</span>
            <span className="info-value">{currentRound?.players.length || 0}</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">Round</span>
            <span className="info-value">#{currentRound?.id.slice(-4) || '----'}</span>
          </div>
        </div>
      </div>

      {/* Bet Section */}
      {currentRound?.status !== 'finished' && currentRound?.status !== 'spinning' && (
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
              disabled={betAmount > maxBet || betAmount <= 0}
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
      {winner && (
        <div className="winner-section card">
          <div className="winner-avatar">
            {winner.avatar ? (
              <img src={winner.avatar} alt={winner.firstName} />
            ) : (
              <span className="winner-emoji">👑</span>
            )}
          </div>
          <div className="winner-info">
            <span className="winner-name">{winner.firstName} wins!</span>
            <span className="winner-prize">{formatPool()}</span>
          </div>
        </div>
      )}

      {/* Players List */}
      <div className="players-list card">
        <h3>🎮 Players</h3>
        {currentRound?.players.map((player, index) => (
          <div key={index} className="player-item">
            <div className="player-color" style={{ backgroundColor: player.color }} />
            <span className="player-name">{player.firstName}</span>
            <span className="player-bet">
              {player.bets.map(b => `${b.amount} ${b.currency}`).join(' + ')}
            </span>
          </div>
        ))}
        {(!currentRound?.players || currentRound.players.length === 0) && (
          <div className="no-players">No players yet. Be the first!</div>
        )}
      </div>
    </div>
  );
};