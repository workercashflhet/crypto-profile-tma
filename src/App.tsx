// src/App.tsx
import React, { useState, useEffect } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { NewMainPage } from './pages/NewMainPage';
import { NewProfilePage } from './pages/NewProfilePage';
import { NewPvPGame } from './pages/NewPvPGame';
import { NewLeaderboard } from './pages/NewLeaderboard';
import { NewSettings } from './pages/NewSettings';
import { ThemeToggle } from './components/ThemeToggle';
import { useTelegramUser } from './hooks/useTelegramUser';
import './App.css';
import './theme/newTheme.css';

const manifestUrl = 'https://raw.githubusercontent.com/workercashflhet/crypto-profile-tma/main/public/tonconnect-manifest.json';

type Tab = 'home' | 'pvp' | 'profile' | 'leaderboard' | 'settings';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isNewTheme, setIsNewTheme] = useState(true);
  const { user, isLoading } = useTelegramUser();

  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
    }
  }, [user]);

  const toggleTheme = () => {
    setIsNewTheme(!isNewTheme);
    document.body.classList.toggle('theme-new');
  };

  if (isLoading) {
    return <div className="app">Loading...</div>;
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <NewMainPage />;
      case 'pvp':
        return <NewPvPGame />;
      case 'profile':
        return <NewProfilePage />;
      case 'leaderboard':
        return <NewLeaderboard />;
      case 'settings':
        return <NewSettings />;
      default:
        return <NewMainPage />;
    }
  };

  return (
    <div className={`app ${isNewTheme ? 'theme-new' : ''}`}>
      <div className="app-content">
        {renderPage()}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>
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
        <button
          className={`nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          <span className="nav-icon">🏆</span>
          <span className="nav-label">Top</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </nav>

      <ThemeToggle isNewTheme={isNewTheme} onToggle={toggleTheme} />
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