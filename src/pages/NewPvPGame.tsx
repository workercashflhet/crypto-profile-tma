// src/pages/NewPvPGame.tsx
import React, { useState } from 'react';
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
  const [selectedBalls, setSelectedBalls] = useState<number>(1);
  const [betAmount, setBetAmount] = useState<string>('1');

  return (
    <div className="new-pvp-page">
      {/* Status */}
      <div className="pvp-status card">
        <div className="status-indicator waiting">
          <span className="status-dot" />
          <span className="status-text">Waiting for players</span>
        </div>
        <div className="status-info">
          <div className="info-item">
            <span className="info-label">Prize pool</span>
            <span className="info-value">250 TON</span>
          </div>
          <div className="info-divider" />
          <div className="info-item">
            <span className="info-label">Game #</span>
            <span className="info-value">#0421</span>
          </div>
        </div>
      </div>

      {/* Bet Input */}
      <div className="bet-section card">
        <div className="bet-input-group">
          <input
            type="number"
            className="bet-input"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="Enter amount"
          />
          <button className="btn-primary play-btn">Play</button>
        </div>
      </div>

      {/* Ball Options */}
      <div className="ball-options card">
        <h3>Select Balls</h3>
        <div className="balls-grid">
          {BALL_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`ball-option ${selectedBalls === option.value ? 'active' : ''}`}
              onClick={() => setSelectedBalls(option.value)}
            >
              <span className="ball-number">{option.value}</span>
              <span className="ball-price">{option.price} USDT</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Players */}
      <div className="active-players card">
        <h3>🎮 Active Players</h3>
        <div className="players-list">
          <div className="player-item">
            <div className="player-avatar">🐋</div>
            <div className="player-info">
              <span className="player-name">crypto_whale</span>
              <span className="player-bet">150 TON</span>
            </div>
          </div>
          <div className="player-item">
            <div className="player-avatar">🦊</div>
            <div className="player-info">
              <span className="player-name">fox_trader</span>
              <span className="player-bet">75 TON</span>
            </div>
          </div>
          <div className="player-item">
            <div className="player-avatar">🐉</div>
            <div className="player-info">
              <span className="player-name">dragon_king</span>
              <span className="player-bet">200 TON</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};