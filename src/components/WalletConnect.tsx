import React, { useState, useEffect } from 'react';
import {
  useTonConnectUI,
  useTonWallet,
  TonConnectButton,
} from '@tonconnect/ui-react';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { useReferral } from '../hooks/useReferral';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const balances = useWalletBalance();
  const { getReferralStats } = useReferral();
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnedTon: 0,
    totalEarnedStars: 0,
    availableTon: 0,
    availableStars: 0,
    claimedTon: 0,
    claimedStars: 0,
  });
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string | null>(null);

  useEffect(() => {
    const stats = getReferralStats();
    setReferralStats(stats);
  }, [getReferralStats]);

  const handleClaimReferralRewards = async () => {
    if (!wallet) {
      setClaimStatus('Please connect your wallet first');
      setTimeout(() => setClaimStatus(null), 3000);
      return;
    }

    if (referralStats.availableTon <= 0 && referralStats.availableStars <= 0) {
      setClaimStatus('No rewards available to claim');
      setTimeout(() => setClaimStatus(null), 3000);
      return;
    }

    setIsClaiming(true);
    setClaimStatus(null);

    try {
      // Создаем транзакцию для вывода TON (если есть)
      if (referralStats.availableTon > 0) {
        const tonAmount = referralStats.availableTon;
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: wallet.account.address,
              amount: (tonAmount * 1_000_000_000).toString(),
            },
          ],
        });
      }

      // Для Stars нужно создать инвойс (если есть)
      if (referralStats.availableStars > 0) {
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        
        if (tg) {
          const response = await fetch('/api/create-withdraw-invoice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              amount: Math.floor(referralStats.availableStars),
              type: 'withdraw'
            }),
          });

          const data = await response.json();

          if (data.success && data.invoiceLink) {
            tg.openInvoice(data.invoiceLink, (status: string) => {
              if (status === 'paid') {
                setClaimStatus('✅ Rewards claimed successfully!');
                // Обновляем статистику после успешного вывода
                setTimeout(() => {
                  const updatedStats = getReferralStats();
                  setReferralStats(updatedStats);
                }, 1000);
              } else if (status === 'cancelled') {
                setClaimStatus('❌ Withdrawal cancelled');
              } else {
                setClaimStatus('❌ Withdrawal failed');
              }
            });
          } else {
            setClaimStatus('❌ Failed to create withdrawal invoice');
          }
        } else {
          setClaimStatus('❌ Telegram WebApp not available');
        }
      } else {
        setClaimStatus('✅ TON rewards claimed successfully!');
      }

      setTimeout(() => setClaimStatus(null), 5000);
    } catch (error) {
      console.error('Claim error:', error);
      setClaimStatus('❌ Failed to claim rewards');
      setTimeout(() => setClaimStatus(null), 3000);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!wallet) {
    return (
      <div className="wallet-container">
        <div className="connect-section">
          <p className="connect-prompt">Connect your TON wallet to view balances</p>
          <TonConnectButton className="ton-connect-custom" />
        </div>
      </div>
    );
  }

  const shortAddress = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-6)}`;

  return (
    <div className="wallet-container">
      <div className="wallet-info">
        <div className="wallet-header">
          <div className="wallet-status-indicator" />
          <span className="wallet-status-text">Connected</span>
          <div className="wallet-chain-badge">TON Mainnet</div>
        </div>
        
        <div className="wallet-address-section">
          <div className="wallet-label">Address</div>
          <div className="wallet-address-wrapper">
            <div 
              className="wallet-address-full" 
              onClick={() => navigator.clipboard.writeText(wallet.account.address)}
              title="Click to copy"
            >
              {shortAddress}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(wallet.account.address)}
              className="copy-button"
              title="Copy address"
            >
              📋
            </button>
          </div>
        </div>

        <div className="balances-container">
          <h3 className="balances-title">💰 Wallet Balances</h3>
          
          {balances.error && (
            <div className="balance-error">{balances.error}</div>
          )}
          
          <div className="balances-grid">
            <div className="balance-item">
              <div className="balance-icon">
                <img src="/ton.png" alt="TON" className="token-icon" />
              </div>
              <div className="balance-info">
                <div className="balance-label">TON Balance</div>
                <div className="balance-value">
                  {balances.isLoading ? (
                    <span className="balance-loading">...</span>
                  ) : (
                    <>{balances.ton.toFixed(4)} TON</>
                  )}
                </div>
              </div>
            </div>
            
            <div className="balance-item">
              <div className="balance-icon">
                <img src="/stars.png" alt="Stars" className="token-icon" />
              </div>
              <div className="balance-info">
                <div className="balance-label">Stars Balance</div>
                <div className="balance-value">
                  <>{balances.stars.toFixed(0)} ⭐</>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Реферальные вознаграждения */}
        <div className="balances-container" style={{ marginTop: '16px' }}>
          <h3 className="balances-title">🎁 Referral Rewards</h3>
          
          <div className="balances-grid">
            <div className="balance-item">
              <div className="balance-icon">👥</div>
              <div className="balance-info">
                <div className="balance-label">Total Referrals</div>
                <div className="balance-value">
                  {referralStats.totalReferrals}
                </div>
              </div>
            </div>
            
            <div className="balance-item">
              <div className="balance-icon">💰</div>
              <div className="balance-info">
                <div className="balance-label">Available TON</div>
                <div className="balance-value" style={{ color: '#2ea6ff' }}>
                  {referralStats.availableTon.toFixed(4)} TON
                </div>
              </div>
            </div>
            
            <div className="balance-item">
              <div className="balance-icon">⭐</div>
              <div className="balance-info">
                <div className="balance-label">Available Stars</div>
                <div className="balance-value" style={{ color: '#ffd700' }}>
                  {referralStats.availableStars.toFixed(0)} ⭐
                </div>
              </div>
            </div>
            
            <div className="balance-item">
              <div className="balance-icon">📊</div>
              <div className="balance-info">
                <div className="balance-label">Total Earned</div>
                <div className="balance-value">
                  {referralStats.totalEarnedTon.toFixed(2)} TON + {referralStats.totalEarnedStars.toFixed(0)} ⭐
                </div>
              </div>
            </div>
          </div>

          <button 
            className="disconnect-button" 
            style={{ 
              marginTop: '16px', 
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              position: 'relative'
            }}
            onClick={handleClaimReferralRewards}
            disabled={isClaiming || (referralStats.availableTon <= 0 && referralStats.availableStars <= 0)}
          >
            {isClaiming ? (
              <>⏳ Processing...</>
            ) : (
              <>💎 Claim Referral Rewards ({(referralStats.availableTon + referralStats.availableStars / 76).toFixed(2)} TON equivalent)</>
            )}
          </button>
          
          {claimStatus && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              borderRadius: '8px', 
              textAlign: 'center',
              fontSize: '13px',
              background: claimStatus.includes('✅') ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)',
              color: claimStatus.includes('✅') ? '#30d158' : '#ff453a'
            }}>
              {claimStatus}
            </div>
          )}
        </div>

        <button 
          onClick={() => tonConnectUI.disconnect()} 
          className="disconnect-button"
          style={{ marginTop: '16px' }}
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
};

export default WalletConnect;