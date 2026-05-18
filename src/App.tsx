import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import UserProfile from './components/UserProfile';
import WalletConnect from './components/WalletConnect';
import Balance from './components/Balance';
import './App.css';

// Манифест приложения для TonConnect
const manifestUrl =
  'https://raw.githubusercontent.com/ton-community/tutorials/main/03-wallet/vite/temp/manifest.json';

const AppContent: React.FC = () => {
  return (
    <div className="app">
      <h1 className="app-title">Crypto Profile</h1>
      <UserProfile />
      <WalletConnect />
      <Balance />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <AppContent />
    </TonConnectUIProvider>
  );
};

export default App;