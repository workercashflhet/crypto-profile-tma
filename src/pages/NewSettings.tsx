// src/pages/NewSettings.tsx
import React, { useState } from 'react';
import './NewSettings.css';

type SettingsTab = 'feel' | 'language' | 'account';

export const NewSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('feel');
  const [haptics, setHaptics] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [confirmBets, setConfirmBets] = useState(true);
  const [language, setLanguage] = useState('English');
  const [anonymousMode, setAnonymousMode] = useState(false);

  return (
    <div className="new-settings-page">
      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'feel' ? 'active' : ''}`}
          onClick={() => setActiveTab('feel')}
        >
          Feel
        </button>
        <button
          className={`settings-tab ${activeTab === 'language' ? 'active' : ''}`}
          onClick={() => setActiveTab('language')}
        >
          Language
        </button>
        <button
          className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
      </div>

      {/* Feel Settings */}
      {activeTab === 'feel' && (
        <div className="settings-section card">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Haptics</span>
              <span className="setting-description">Vibration feedback</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={haptics}
                onChange={() => setHaptics(!haptics)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Reduce motion</span>
              <span className="setting-description">Disable animations</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={() => setReduceMotion(!reduceMotion)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Confirm bets</span>
              <span className="setting-description">Ask before placing bet</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={confirmBets}
                onChange={() => setConfirmBets(!confirmBets)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      )}

      {/* Language Settings */}
      {activeTab === 'language' && (
        <div className="settings-section card">
          <div className="language-options">
            {['English', 'Spanish', 'French', 'German', 'Russian', 'Chinese'].map((lang) => (
              <button
                key={lang}
                className={`language-option ${language === lang ? 'active' : ''}`}
                onClick={() => setLanguage(lang)}
              >
                {lang}
                {language === lang && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account Settings */}
      {activeTab === 'account' && (
        <div className="settings-section card">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Anonymous mode</span>
              <span className="setting-description">Hide avatar and name</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={anonymousMode}
                onChange={() => setAnonymousMode(!anonymousMode)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">Account ID</span>
              <span className="setting-description">#123456789</span>
            </div>
            <button className="btn-secondary small-btn">Copy</button>
          </div>

          <button className="btn-secondary danger-btn">Delete Account</button>
        </div>
      )}
    </div>
  );
};