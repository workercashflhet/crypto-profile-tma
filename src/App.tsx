import React, { useState } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import UserProfile from './components/UserProfile';
import WalletConnect from './components/WalletConnect';
import PvPGame from './components/PvPGame';
import AdminPanel from './components/AdminPanel';
import { useTelegramUser } from './hooks/useTelegramUser';
import './App.css';

const manifestUrl = 'https://raw.githubusercontent.com/workercashflhet/crypto-profile-tma/main/public/tonconnect-manifest.json';

type Tab = 'pvp' | 'profile' | 'admin';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('pvp');
  const { user } = useTelegramUser();
  const isAdmin = user?.id === 479243932;

  return (
    <div className="app">
      <div className="app-content">
        {activeTab === 'profile' ? (
          <>
            <UserProfile />
            <WalletConnect />
          </>
        ) : activeTab === 'admin' && isAdmin ? (
          <AdminPanel />
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
        {isAdmin && (
          <button
            className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <span className="nav-icon">🔧</span>
            <span className="nav-label">Admin</span>
          </button>
        )}
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