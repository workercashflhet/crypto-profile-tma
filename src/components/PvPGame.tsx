import React, { useEffect, useState } from 'react';
import { usePvPGame } from '../hooks/usePvPGame';
import { CurrencyType } from '../types/pvp';
import LuckyWheel from './LuckyWheel';
import DepositModal from './DepositModal';
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
    getTotalPool,
    depositTon,
    depositUsdt,
  } = usePvPGame();

  const segments = calculateSegments();
  const myTotalBet = playerBets.reduce((sum, b) => sum + b.amount, 0);
  const [isDepositOpen, setIsDepositOpen] = useState(false);

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

  const handleDeposit = (amount: number, currency: CurrencyType) => {
    if (currency === 'ton') {
      depositTon(amount);
    } else {
      depositUsdt(amount);
    }
  };

  const maxBet = selectedCurrency === 'ton' ? balance.ton : balance.usdt;

  const formatPlayerBets = (player: { bets: { amount: number; currency: CurrencyType }[] }): string => {
    const tonBets = player.bets.filter(b => b.currency === 'ton');
    const usdtBets = player.bets.filter(b => b.currency === 'usdt');
    
    const tonTotal = tonBets.reduce((sum, b) => sum + b.amount, 0);
    const usdtTotal = usdtBets.reduce((sum, b) => sum + b.amount, 0);
    
    const parts: string[] = [];
    if (tonTotal > 0) parts.push(`${tonTotal} TON`);
    if (usdtTotal > 0) parts.push(`${usdtTotal} USDT`);
    
    return parts.join(' + ');
  };

  const calculateWinChance = (player: { totalBet: number }): string => {
    if (!currentRound) return '0';
    
    const totalPoolValue = currentRound.totalPoolTon + currentRound.totalPoolUsdt;
    if (totalPoolValue === 0) return '0';
    
    return ((player.totalBet / totalPoolValue) * 100).toFixed(1);
  };

  return (
    <div className="pvp-game">
      {/* Баланс и кнопка депозита */}
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
        <button 
          className="deposit-nav-button"
          onClick={() => setIsDepositOpen(true)}
        >
          + Deposit
        </button>
      </div>

      {/* Мои ставки */}
      {playerBets.length > 0 && (
        <div className="my-bets-bar">
          <span>My bets: {formatPlayerBets({ bets: playerBets })}</span>
          <span className="bets-count">
            {calculateWinChance({ totalBet: myTotalBet })}%
          </span>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="pvp-stats">
        <div className="stat-box">
          <div className="stat-label">Pool</div>
          <div className="stat-value">{getTotalPool()}</div>
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
              value={betAmount || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setBetAmount(0);
                } else {
                  const parsed = parseInt(value.replace(/^0+/, ''), 10);
                  if (!isNaN(parsed)) {
                    setBetAmount(parsed);
                  }
                }
              }}
              min="1"
              max={maxBet}
              placeholder="Enter amount"
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
              <span className="player-bet">{formatPlayerBets(player)}</span>
              <span className="player-share">
                {calculateWinChance(player)}%
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

      {/* Модальное окно депозита */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDepositSuccess={handleDeposit}
        balance={balance}
      />
    </div>
  );
};

export default PvPGame;