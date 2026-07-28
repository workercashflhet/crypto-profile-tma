// src/pages/NewLeaderboard.tsx
import React from 'react';
import './NewLeaderboard.css';

const TOP_PLAYERS = [
  { id: 1, name: 'CryptoKing', bets: 12500, prize: 5000 },
  { id: 2, name: 'TONMaster', bets: 8700, prize: 3200 },
  { id: 3, name: 'DeFiWhale', bets: 6400, prize: 2100 },
  { id: 4, name: 'NFTPro', bets: 4200, prize: 0 },
  { id: 5, name: 'Hodler420', bets: 3800, prize: 0 },
  { id: 6, name: 'MoonRider', bets: 2900, prize: 0 },
];

export const NewLeaderboard: React.FC = () => {
  const top3 = TOP_PLAYERS.slice(0, 3);
  const others = TOP_PLAYERS.slice(3);

  return (
    <div className="new-leaderboard-page">
      {/* Timer */}
      <div className="timer-card card">
        <span className="timer-label">⏱️ Ending</span>
        <span className="timer-value">10d 12:37:44</span>
      </div>

      {/* Top 3 */}
      <div className="top-three">
        {top3.map((player, index) => (
          <div key={player.id} className={`top-player top-${index + 1}`}>
            <div className="top-player-rank">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
            </div>
            <div className="top-player-info">
              <span className="top-player-name">{player.name}</span>
              <span className="top-player-bets">{player.bets} TON</span>
            </div>
            {player.prize > 0 && (
              <div className="top-player-prize">🎁 PRIZE</div>
            )}
          </div>
        ))}
      </div>

      {/* Other Players */}
      <div className="others-list card">
        <h3>📊 All Players</h3>
        {others.map((player, index) => (
          <div key={player.id} className="other-player">
            <div className="other-player-rank">#{index + 4}</div>
            <div className="other-player-info">
              <span className="other-player-name">{player.name}</span>
              <span className="other-player-bets">{player.bets} TON</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};