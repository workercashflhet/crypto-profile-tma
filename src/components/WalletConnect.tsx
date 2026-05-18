import React, { useState } from 'react';
import {
  useTonConnectUI,
  useTonWallet,
  TonConnectButton,
} from '@tonconnect/ui-react';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { formatAddress } from '../utils/addressUtils';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const balances = useWalletBalance();
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Конвертируем в non-bounceable формат (UQ...)
  const rawAddress = wallet.account.address;
  const friendlyAddress = formatAddress(rawAddress);
  
  // Форматированный адрес для отображения
  const displayAddress = showFullAddress 
    ? friendlyAddress 
    : `${friendlyAddress.slice(0, 8)}...${friendlyAddress.slice(-8)}`;

  // Копирование адреса
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(friendlyAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-info">
        <div className="wallet-header">
          <div className="wallet-status-indicator" />
          <span className="wallet-status-text">Connected</span>
          <span className="wallet-chain-badge">
            {wallet.account.chain === '-239' ? 'Mainnet' : 'Testnet'}
          </span>
        </div>
        
        <div className="wallet-address-section">
          <div className="wallet-label">Wallet Address</div>
          <div className="wallet-address-wrapper">
            <div 
              className="wallet-address-full" 
              title={friendlyAddress}
              onClick={() => setShowFullAddress(!showFullAddress)}
            >
              {displayAddress}
            </div>
            <div className="wallet-actions">
              <button 
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="address-toggle-button"
                title={showFullAddress ? "Show short address" : "Show full address"}
              >
                {showFullAddress ? '👁️' : '👁️‍🗨️'}
              </button>
              <button 
                onClick={handleCopy}
                className="copy-button"
                title="Copy address"
              >
                {copied ? '✅' : '📋'}
              </button>
            </div>
          </div>
          {copied && (
            <div className="copied-notification">Address copied!</div>
          )}
        </div>

        {/* Балансы */}
        <div className="balances-container">
          <h3 className="balances-title">Wallet Balances</h3>
          
          {balances.error && (
            <div className="balance-error">{balances.error}</div>
          )}
          
          <div className="balances-grid">
            <div className="balance-item">
              <div className="balance-icon">
                <img src="/ton.png" alt="TON" className="token-icon" />
              </div>
              <div className="balance-info">
                <div className="balance-label">TON</div>
                <div className="balance-value">
                  {balances.isLoading ? (
                    <span className="balance-loading">...</span>
                  ) : (
                    <>
                      {balances.ton.toFixed(4)}
                      <span className="balance-symbol"> TON</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="balance-item">
              <div className="balance-icon">
                <img src="/ustd.png" alt="USDT" className="token-icon" />
              </div>
              <div className="balance-info">
                <div className="balance-label">USDT</div>
                <div className="balance-value">
                  {balances.isLoading ? (
                    <span className="balance-loading">...</span>
                  ) : (
                    <>
                      {balances.usdt.toFixed(2)}
                      <span className="balance-symbol"> USDT</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => tonConnectUI.disconnect()} 
          className="disconnect-button"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
};

export default WalletConnect;