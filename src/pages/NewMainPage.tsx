// src/pages/NewMainPage.tsx
import React, { useState } from 'react';
import './NewMainPage.css';

interface Game {
  id: string;
  name: string;
  icon: string;
}

const GAMES: Game[] = [
  { id: 'all', name: 'All Games', icon: '🎮' },
  { id: 'pvp', name: 'PVP', icon: '⚔️' },
  { id: 'ice', name: 'Ice Arena', icon: '❄️' },
  { id: 'ball', name: 'Ball Race', icon: '🏀' },
];

export const NewMainPage: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState('all');

  return (
    <div className="new-main-page">
      {/* Header - только название */}
      <header className="new-header">
        <span className="header-title">Bets.</span>
      </header>

      {/* Balance Block - TON и Stars */}
      <div className="balance-block card">
        <div className="balance-row">
          <div className="balance-item">
            <span className="balance-label">TON</span>
            <span className="balance-value">0.00</span>
          </div>
          <div className="balance-divider" />
          <div className="balance-item">
            <span className="balance-label">Stars</span>
            <span className="balance-value">0</span>
          </div>
        </div>
        <button className="btn-primary deposit-btn">
          Deposit
        </button>
      </div>

      {/* Giveaway Block */}
      <div className="giveaway-block card">
        <div className="giveaway-content">
          <span className="giveaway-label">🎁 Giveaway</span>
          <span className="giveaway-prize" style={{ color: '#FFD700' }}>
            $12.000
          </span>
        </div>
      </div>

      {/* Games Horizontal Scroll */}
      <div className="games-scroll">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className={`game-tab ${selectedGame === game.id ? 'active' : ''}`}
            onClick={() => setSelectedGame(game.id)}
          >
            <span className="game-icon">{game.icon}</span>
            <span className="game-name">{game.name}</span>
          </button>
        ))}
      </div>

      {/* Daily Spin */}
      <div className="daily-spin card pulse-animation">
        <div className="spin-content">
          <div className="spin-icon">🎡</div>
          <div className="spin-info">
            <h3>Daily Spin</h3>
            <p className="text-secondary">Spin to win up to 1000 USDT</p>
          </div>
          <button className="spin-button btn-primary">Spin</button>
        </div>
      </div>

      {/* Featured Games */}
      <div className="featured-games">
        <h3>🔥 Popular Games</h3>
        <div className="games-grid">
          <div className="game-card card">
            <div className="game-card-icon">⚔️</div>
            <div className="game-card-name">PVP Arena</div>
            <div className="game-card-players">1.2k playing</div>
          </div>
          <div className="game-card card">
            <div className="game-card-icon">❄️</div>
            <div className="game-card-name">Ice Arena</div>
            <div className="game-card-players">856 playing</div>
          </div>
          <div className="game-card card">
            <div className="game-card-icon">🏀</div>
            <div className="game-card-name">Ball Race</div>
            <div className="game-card-players">2.4k playing</div>
          </div>
        </div>
      </div>
    </div>
  );
};