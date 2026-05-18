import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import UserProfile from './components/UserProfile';
import './App.css';

const manifestUrl = 'https://raw.githubusercontent.com/workercashflhet/crypto-profile-tma/main/public/tonconnect-manifest.json';

const App: React.FC = () => {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <div className="app">
        <h1 className="app-title">Crypto Profile</h1>
        <UserProfile />
        <p style={{color: 'white', textAlign: 'center', padding: '20px'}}>
          Wallet connect loading...
        </p>
      </div>
    </TonConnectUIProvider>
  );
};

export default App;