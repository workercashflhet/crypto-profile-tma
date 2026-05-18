import React from 'react';
import {
  useTonConnectUI,
  useTonWallet,
  TonConnectButton,
} from '@tonconnect/ui-react';
import { useWalletBalance } from '../hooks/useWalletBalance';
import './WalletConnect.css';

const WalletConnect: React.FC = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const balances = useWalletBalance();

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
        </div>
        
        <div className="wallet-address-section">
          <div className="wallet-label">Address</div>
          <div className="wallet-address">{shortAddress}</div>
          <button 
            onClick={() => navigator.clipboard.writeText(wallet.account.address)}
            className="copy-button"
            title="Copy address"
          >
            📋
          </button>
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
                <img src="/usdt.png" alt="USDT" className="token-icon" />
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