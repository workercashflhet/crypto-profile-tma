import React, { useState } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import UserProfile from './components/UserProfile';
import WalletConnect from './components/WalletConnect';
import Balance from './components/Balance';
import PvPGame from './components/PvPGame';
import './App.css';

const manifestUrl = 'https://raw.githubusercontent.com/workercashflhet/crypto-profile-tma/main/public/tonconnect-manifest.json';

type Tab = 'pvp' | 'profile';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pvp');

  return (
    <div className="app">
      <div className="app-content">
        {activeTab === 'profile' ? (
          <>
            <UserProfile />
            <WalletConnect />
            <Balance />
          </>
        ) : (
          <PvPGame />
        )}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'pvp' ? 'active' : ''}`}
          onClick={() => setActiveTab('pvp')}
        >
          <span className="nav-icon">🎰</span>
          <span className="nav-label">PvP</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>
      </nav>
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