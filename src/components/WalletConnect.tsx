import React from 'react';
import {
  useTonConnectUI,
  useTonWallet,
  TonConnectButton,
} from '@tonconnect/ui-react';
import { useWalletBalance } from '../hooks/useWalletBalance';
import './WalletConnect.css';

// Компонент для отображения балансов
const BalanceDisplay: React.FC<{
  ton: number;
  usdt: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}> = ({ ton, usdt, isLoading, error, lastUpdated }) => {
  return (
    <div className="balances-container">
      <h3 className="balances-title">Wallet Balances</h3>
      
      {error && (
        <div className="balance-error">{error}</div>
      )}
      
      <div className="balances-grid">
        <div className="balance-item">
          <div className="balance-icon">💎</div>
          <div className="balance-info">
            <div className="balance-label">TON</div>
            <div className="balance-value">
              {isLoading ? (
                <span className="balance-loading">Loading...</span>
              ) : (
                <>
                  {ton.toFixed(4)}
                  <span className="balance-symbol"> TON</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="balance-item">
          <div className="balance-icon">💵</div>
          <div className="balance-info">
            <div className="balance-label">USDT</div>
            <div className="balance-value">
              {isLoading ? (
                <span className="balance-loading">Loading...</span>
              ) : (
                <>
                  {usdt.toFixed(2)}
                  <span className="balance-symbol"> USDT</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {lastUpdated && (
        <div className="balance-updated">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// Информация о кошельке
const WalletInfo: React.FC = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const balances = useWalletBalance();

  if (!wallet) return null;

  // Форматирование адреса
  const shortAddress = `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-6)}`;

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
  };

  return (
    <div className="wallet-info">
      <div className="wallet-header">
        <div className="wallet-status-indicator" />
        <span className="wallet-status-text">Connected</span>
      </div>
      
      <div className="wallet-address-section">
        <div className="wallet-label">Address</div>
        <div className="wallet-address" title={wallet.account.address}>
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
      
      {/* Отображение балансов */}
      <BalanceDisplay
        ton={balances.ton}
        usdt={balances.usdt}
        isLoading={balances.isLoading}
        error={balances.error}
        lastUpdated={balances.lastUpdated}
      />
      
      <div className="wallet-network">
        <span className="network-badge">
          {wallet.account.chain === '-239' ? 'Mainnet' : 'Testnet'}
        </span>
      </div>
      
      <button onClick={handleDisconnect} className="disconnect-button">
        Disconnect Wallet
      </button>
    </div>
  );
};

// Основной компонент
const WalletConnect: React.FC = () => {
  const wallet = useTonWallet();

  return (
    <div className="wallet-container">
      {!wallet ? (
        <div className="connect-section">
          <p className="connect-prompt">Connect your TON wallet to view balances</p>
          <TonConnectButton className="ton-connect-custom" />
        </div>
      ) : (
        <WalletInfo />
      )}
    </div>
  );
};

export default WalletConnect;