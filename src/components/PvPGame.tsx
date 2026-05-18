import React, { useEffect } from 'react';
import { usePvPGame } from '../hooks/usePvPGame';
import { CurrencyType } from '../types/pvp';
import LuckyWheel from './LuckyWheel';
import './PvPGame.css';

const PvPGame: React.FC = () => {
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
    playerBets,
    calculateSegments,
    placeBet,
    spinWheel,
    resetRound,
    getTotalPool,
  } = usePvPGame();

  const segments = calculateSegments();
  const myTotalBet = playerBets.reduce((sum, b) => sum + b.amount, 0);

  useEffect(() => {
    if (currentRound?.status === 'spinning' && currentRound.players.length > 0 && !isSpinning) {
      spinWheel();
    }
  }, [currentRound?.status]);

  const getPlayerAvatar = (player: { avatar?: string; userId: number }) => {
    if (player.avatar) return player.avatar;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.userId}`;
  };

  const handlePlaceBet = () => {
    placeBet(betAmount, selectedCurrency);
  };

  const maxBet = selectedCurrency === 'ton' ? balance.ton : balance.usdt;

  return (
    <div className="pvp-game">
      <div className="pvp-header">
        <h2 className="pvp-title">🎰 PvP Lucky Wheel</h2>
        <p className="pvp-subtitle">Multiplayer • Multiple bets allowed</p>
      </div>

      {/* Баланс */}
      <div className="player-balance-bar">
        <div 
          className={`balance-item-small ${selectedCurrency === 'ton' ? 'active-currency' : ''}`}
          onClick={() => setSelectedCurrency('ton')}
        >
          <img src="/ton.png" alt="TON" className="balance-icon-small" />
          <span className="balance-value-small">{balance.ton.toFixed(1)} TON</span>
        </div>
        <div 
          className={`balance-item-small ${selectedCurrency === 'usdt' ? 'active-currency' : ''}`}
          onClick={() => setSelectedCurrency('usdt')}
        >
          <img src="/ustd.png" alt="USDT" className="balance-icon-small" />
          <span className="balance-value-small">{balance.usdt.toFixed(1)} USDT</span>
        </div>
      </div>

      {/* Мои ставки */}
      {myTotalBet > 0 && (
        <div className="my-bets-bar">
          <span>My bets: {myTotalBet} {selectedCurrency.toUpperCase()}</span>
          <span className="bets-count">({playerBets.length} bet{playerBets.length > 1 ? 's' : ''})</span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="pvp-stats">
        <div className="stat-box">
          <div className="stat-label">Pool</div>
          <div className="stat-value small">{getTotalPool()}</div>
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
          {/* Выбор валюты */}
          <div className="currency-toggle">
            <button
              className={`currency-btn ${selectedCurrency === 'ton' ? 'active' : ''}`}
              onClick={() => setSelectedCurrency('ton')}
            >
              💎 TON
            </button>
            <button
              className={`currency-btn ${selectedCurrency === 'usdt' ? 'active' : ''}`}
              onClick={() => setSelectedCurrency('usdt')}
            >
              💵 USDT
            </button>
          </div>

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
              max={maxBet}
            />
            <button 
              className="bet-adjust" 
              onClick={() => setBetAmount(Math.min(maxBet, betAmount + 5))}
            >
              +
            </button>
          </div>

          <button 
            className="place-bet-button"
            onClick={handlePlaceBet}
            disabled={betAmount > maxBet || betAmount <= 0}
          >
            🎯 Place Bet ({betAmount} {selectedCurrency.toUpperCase()})
          </button>
          <p className="color-auto-text">
            You can place multiple bets • Color assigned automatically
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
            {getTotalPool()}
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
              <span className="player-bet">{player.totalBet} {player.currency.toUpperCase()}</span>
              <span className="player-share">
                ({player.bets.length} bet{player.bets.length > 1 ? 's' : ''})
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