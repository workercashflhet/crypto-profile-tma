import React, { useEffect } from 'react';
import { usePvPGame } from '../hooks/usePvPGame';
import LuckyWheel from './LuckyWheel';
import './PvPGame.css';

const PvPGame: React.FC = () => {
  const {
    currentRound,
    betAmount,
    setBetAmount,
    isSpinning,
    rotationAngle,
    winner,
    error,
    balance,
    calculateSegments,
    placeBet,
    spinWheel,
    resetRound,
  } = usePvPGame();

  const segments = calculateSegments();

  useEffect(() => {
    if (currentRound?.status === 'spinning' && currentRound.players.length > 0 && !isSpinning) {
      spinWheel();
    }
  }, [currentRound?.status]);

  const getPlayerAvatar = (player: { avatar?: string; userId: number }) => {
    if (player.avatar) return player.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.userId}`;
  };

  return (
    <div className="pvp-game">
      <div className="pvp-header">
        <h2 className="pvp-title">🎰 PvP Lucky Wheel</h2>
        <p className="pvp-subtitle">Multiplayer • Bet against real players!</p>
      </div>

      {/* Баланс игрока */}
      <div className="player-balance-bar">
        <div className="balance-item-small">
          <img src="/ton.png" alt="TON" className="balance-icon-small" />
          <span className="balance-value-small">{balance.ton.toFixed(1)} TON</span>
        </div>
        <div className="balance-item-small">
          <img src="/ustd.png" alt="USDT" className="balance-icon-small" />
          <span className="balance-value-small">{balance.usdt.toFixed(1)} USDT</span>
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="pvp-stats">
        <div className="stat-box">
          <div className="stat-label">Pool</div>
          <div className="stat-value">{currentRound?.totalPool || 0} TON</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Players</div>
          <div className="stat-value">{currentRound?.players.length || 0}</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Round</div>
          <div className="stat-value">#{currentRound?.id.slice(-4) || '----'}</div>
        </div>
      </div>

      <LuckyWheel 
        segments={segments} 
        rotationAngle={rotationAngle} 
        isSpinning={isSpinning}
        timeLeft={currentRound?.timeLeft || 0}
      />

      {currentRound?.status !== 'finished' && currentRound?.status !== 'spinning' && (
        <div className="bet-section">
          <div className="bet-input-group">
            <button 
              className="bet-adjust" 
              onClick={() => setBetAmount(Math.max(1, betAmount - 5))}
            >
              -
            </button>
            <input
              type="number"
              className="bet-input"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              min="1"
              max={balance.ton}
            />
            <button 
              className="bet-adjust" 
              onClick={() => setBetAmount(Math.min(balance.ton, betAmount + 5))}
            >
              +
            </button>
          </div>

          <button 
            className="place-bet-button"
            onClick={() => placeBet(betAmount)}
            disabled={betAmount > balance.ton}
          >
            🎯 Place Bet ({betAmount} TON)
          </button>
          <p className="color-auto-text">
            Balance: {balance.ton.toFixed(1)} TON • Color assigned automatically
          </p>
        </div>
      )}

      {currentRound?.status === 'spinning' && (
        <div className="spinning-status">
          <div className="spinning-text">🎰 Spinning...</div>
        </div>
      )}

      {winner && (
        <div className="winner-section">
          <img 
            src={getPlayerAvatar(winner)}
            alt={winner.firstName}
            className="winner-avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${winner.userId}`;
            }}
          />
          <div className="winner-crown">👑</div>
          <div className="winner-announcement">
            {winner.firstName} wins!
          </div>
          <div className="winner-prize">
            {currentRound?.totalPool} TON
          </div>
          <button className="new-round-button" onClick={resetRound}>
            🔄 New Round
          </button>
        </div>
      )}

      <div className="players-list">
        <h3>🎮 Players in Pool</h3>
        {currentRound?.players.map((player, index) => (
          <div key={index} className={`player-item ${winner?.userId === player.userId ? 'winner-player' : ''}`}>
            <div className="player-color" style={{ backgroundColor: player.color }} />
            <img 
              src={getPlayerAvatar(player)}
              alt={player.firstName}
              className="player-avatar-small"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.userId}`;
              }}
            />
            <div className="player-info">
              <span className="player-name">
                {player.firstName}
                {winner?.userId === player.userId && ' 👑'}
              </span>
              <span className="player-username">@{player.username}</span>
            </div>
            <div className="player-stats">
              <span className="player-bet">{player.bet} TON</span>
              <span className="player-share">
                {((player.bet / (currentRound?.totalPool || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
        {(!currentRound?.players || currentRound.players.length === 0) && (
          <div className="no-players">
            <p>No players yet</p>
            <p className="no-players-sub">Be the first to join!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PvPGame;