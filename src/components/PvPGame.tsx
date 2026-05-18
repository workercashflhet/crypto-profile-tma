import React, { useEffect } from 'react';
import { usePvPGame } from '../hooks/usePvPGame';
import LuckyWheel from './LuckyWheel';
import './PvPGame.css';

const PvPGame: React.FC = () => {
  const {
    currentRound,
    betAmount,
    setBetAmount,
    selectedColor,
    setSelectedColor,
    isSpinning,
    rotationAngle,
    winner,
    calculateSegments,
    placeBet,
    spinWheel,
    resetRound,
    COLORS,
  } = usePvPGame();

  const segments = calculateSegments();

  // Автоматический спин когда время выходит
  useEffect(() => {
    if (currentRound?.status === 'spinning' && currentRound.players.length > 0) {
      spinWheel();
    }
  }, [currentRound?.status]);

  return (
    <div className="pvp-game">
      {/* Заголовок */}
      <div className="pvp-header">
        <h2 className="pvp-title">🎰 PvP Lucky Wheel</h2>
        <p className="pvp-subtitle">Bet against other players!</p>
      </div>

      {/* Таймер и пул */}
      <div className="pvp-stats">
        <div className="stat-box">
          <div className="stat-label">Time Left</div>
          <div className={`stat-value ${currentRound?.timeLeft && currentRound.timeLeft <= 10 ? 'time-warning' : ''}`}>
            {currentRound?.timeLeft || 0}s
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Total Pool</div>
          <div className="stat-value">{currentRound?.totalPool || 0} TON</div>
        </div>
        <div className="stat-box">
          <div className="stat-label">Players</div>
          <div className="stat-value">{currentRound?.players.length || 0}</div>
        </div>
      </div>

      {/* Колесо */}
      <LuckyWheel 
        segments={segments} 
        rotationAngle={rotationAngle} 
        isSpinning={isSpinning} 
      />

      {/* Ставка */}
      {currentRound?.status !== 'finished' && (
        <div className="bet-section">
          <div className="color-selector">
            {COLORS.map((color, index) => (
              <button
                key={color}
                className={`color-button ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
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
            />
            <button 
              className="bet-adjust" 
              onClick={() => setBetAmount(betAmount + 5)}
            >
              +
            </button>
          </div>

          <button 
            className="place-bet-button"
            onClick={() => placeBet(betAmount, selectedColor)}
            disabled={currentRound?.status === 'spinning'}
          >
            Place Bet ({betAmount} TON)
          </button>
        </div>
      )}

      {/* Результат */}
      {winner && (
        <div className="winner-section">
          <div className="winner-announcement">
            🎉 {winner.firstName} wins {currentRound?.totalPool} TON!
          </div>
          <button className="new-round-button" onClick={resetRound}>
            New Round
          </button>
        </div>
      )}

      {/* Список игроков */}
      <div className="players-list">
        <h3>Players in Pool</h3>
        {currentRound?.players.map((player, index) => (
          <div key={index} className="player-item">
            <div className="player-color" style={{ backgroundColor: player.color }} />
            <span className="player-name">{player.firstName}</span>
            <span className="player-bet">{player.bet} TON</span>
            <span className="player-share">
              {((player.bet / (currentRound?.totalPool || 1)) * 100).toFixed(1)}%
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

export default PvPGame;