import React from 'react';
import {
  useTonConnectUI,
  useTonWallet,
  TonConnectButton,
} from '@tonconnect/ui-react';
import './WalletConnect.css';

// Хук useTonWallet дает нам информацию о текущем кошельке
const WalletInfo: React.FC = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  if (!wallet) return null;

  // Форматирование адреса для отображения (первые 4 и последние 4 символа)
  const shortAddress = `${wallet.account.address.slice(
    0,
    4
  )}...${wallet.account.address.slice(-4)}`;

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
  };

  return (
    <div className="wallet-info">
      <div className="wallet-address" title={wallet.account.address}>
        {shortAddress}
      </div>
      <div className="wallet-status">Wallet Connected</div>
      <button onClick={handleDisconnect} className="disconnect-button">
        Disconnect Wallet
      </button>
    </div>
  );
};

// Основной компонент, который решает, что показывать
const WalletConnect: React.FC = () => {
  const wallet = useTonWallet();

  return (
    <div className="wallet-container">
      {!wallet ? (
        // Если кошелек не подключен, показываем стандартную кнопку TonConnect
        <div className="connect-section">
          <p className="connect-prompt">Connect your TON wallet to continue</p>
          {/* TonConnectButton сам обрабатывает открытие модального окна */}
          <TonConnectButton className="ton-connect-custom" />
        </div>
      ) : (
        // Если подключен, показываем информацию о кошельке
        <WalletInfo />
      )}
    </div>
  );
};

export default WalletConnect;