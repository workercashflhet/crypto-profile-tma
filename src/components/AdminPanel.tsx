import React, { useState } from 'react';
import { useAdmin } from '../hooks/useAdmin';
import './AdminPanel.css';

const AdminPanel: React.FC = () => {
  const { isAdmin, users, actions, settings, setSettings, isLoading, updateUserBalance, saveSettings, getStats } = useAdmin();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings' | 'logs'>('stats');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  if (isLoading) {
    return <div className="admin-panel">Loading admin panel...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <h2>🚫 Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  const stats = getStats();

  const handleAddBalance = (userId: number, username: string, firstName: string, currency: 'ton' | 'stars') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    if (currency === 'ton') {
      updateUserBalance(userId, username, firstName, numAmount, 0, 'add_balance', reason);
    } else {
      updateUserBalance(userId, username, firstName, 0, numAmount, 'add_balance', reason);
    }
    setAmount('');
    setReason('');
    setSelectedUser(null);
  };

  const handleRemoveBalance = (userId: number, username: string, firstName: string, currency: 'ton' | 'stars') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    if (currency === 'ton') {
      updateUserBalance(userId, username, firstName, -numAmount, 0, 'remove_balance', reason);
    } else {
      updateUserBalance(userId, username, firstName, 0, -numAmount, 'remove_balance', reason);
    }
    setAmount('');
    setReason('');
    setSelectedUser(null);
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔧 Admin Panel</h1>
        <span className="admin-badge">Administrator</span>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          📊 Stats
        </button>
        <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Users
        </button>
        <button className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          ⚙️ Settings
        </button>
        <button className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          📜 Logs
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalBets}</div>
            <div className="stat-label">Total Bets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalWins}</div>
            <div className="stat-label">Total Wins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalTonInGame.toFixed(1)} TON</div>
            <div className="stat-label">TON in Game</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalStarsInGame.toFixed(0)} ⭐</div>
            <div className="stat-label">Stars in Game</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalDepositedTon.toFixed(1)} TON</div>
            <div className="stat-label">Total Deposited</div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-list">
          {users.length === 0 ? (
            <div className="no-data">No users yet</div>
          ) : (
            users.map((user) => (
              <div key={user.userId} className="user-card">
                <div className="user-header">
                  <div>
                    <div className="user-name">{user.firstName}</div>
                    <div className="user-username">@{user.username || `user_${user.userId}`}</div>
                  </div>
                  <div className="user-id">ID: {user.userId}</div>
                </div>
                
                <div className="user-balances">
                  <span className="user-balance ton">💰 {user.tonBalance.toFixed(2)} TON</span>
                  <span className="user-balance stars">⭐ {user.starsBalance.toFixed(0)} Stars</span>
                </div>

                {selectedUser === user.userId ? (
                  <div>
                    <div className="admin-input-group">
                      <input
                        type="number"
                        className="admin-input"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <input
                        type="text"
                        className="admin-input"
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                    <div className="admin-input-group">
                      <button className="admin-button success" onClick={() => handleAddBalance(user.userId, user.username, user.firstName, 'ton')}>
                        + Add TON
                      </button>
                      <button className="admin-button success" onClick={() => handleAddBalance(user.userId, user.username, user.firstName, 'stars')}>
                        + Add Stars
                      </button>
                      <button className="admin-button danger" onClick={() => handleRemoveBalance(user.userId, user.username, user.firstName, 'ton')}>
                        - Remove TON
                      </button>
                      <button className="admin-button danger" onClick={() => handleRemoveBalance(user.userId, user.username, user.firstName, 'stars')}>
                        - Remove Stars
                      </button>
                    </div>
                    <button className="admin-button small" onClick={() => setSelectedUser(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="admin-button small" onClick={() => setSelectedUser(user.userId)}>
                    Edit Balance
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div className="settings-group">
            <label className="settings-label">Round Duration (seconds)</label>
            <input
              type="number"
              className="settings-input"
              value={settings.roundDuration}
              onChange={(e) => setSettings({ ...settings, roundDuration: parseInt(e.target.value) || 30 })}
            />
          </div>
          
          <div className="settings-group">
            <label className="settings-label">Minimum Bet</label>
            <input
              type="number"
              className="settings-input"
              value={settings.minBet}
              onChange={(e) => setSettings({ ...settings, minBet: parseInt(e.target.value) || 1 })}
            />
          </div>
          
          <div className="settings-group">
            <label className="settings-label">Maximum Bet</label>
            <input
              type="number"
              className="settings-input"
              value={settings.maxBet}
              onChange={(e) => setSettings({ ...settings, maxBet: parseInt(e.target.value) || 1000 })}
            />
          </div>
          
          <div className="settings-group">
            <label className="settings-label">TON to Stars Rate</label>
            <input
              type="number"
              className="settings-input"
              value={settings.tonToStarsRate}
              onChange={(e) => setSettings({ ...settings, tonToStarsRate: parseInt(e.target.value) || 76 })}
            />
          </div>
          
          <div className="settings-group">
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.withdrawalEnabled}
                onChange={(e) => setSettings({ ...settings, withdrawalEnabled: e.target.checked })}
              />
              Enable Withdrawals
            </label>
            
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={settings.depositEnabled}
                onChange={(e) => setSettings({ ...settings, depositEnabled: e.target.checked })}
              />
              Enable Deposits
            </label>
          </div>
          
          <button className="admin-button" onClick={handleSaveSettings}>
            Save Settings
          </button>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="actions-list">
          {actions.length === 0 ? (
            <div className="no-data">No admin actions logged yet</div>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="action-item">
                <div className="action-header">
                  <span className="action-admin">Admin ID: {action.adminId}</span>
                  <span>{new Date(action.timestamp).toLocaleString()}</span>
                </div>
                <div className="action-header">
                  <span className="action-type">{action.action.replace(/_/g, ' ').toUpperCase()}</span>
                  <span>User ID: {action.targetUserId || 'N/A'}</span>
                </div>
                {action.amount && (
                  <div className="action-details">
                    Amount: {action.amount} {action.currency?.toUpperCase()}
                  </div>
                )}
                {action.reason && (
                  <div className="action-details">Reason: {action.reason}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;