// src/pages/NewProfilePage.tsx
import React, { useState } from 'react';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { useGameBalance } from '../hooks/useGameBalance';
import './NewProfilePage.css';

type ProfileTab = 'promocodes' | 'referals' | 'stacking';

export const NewProfilePage: React.FC = () => {
  const { user } = useTelegramUser();
  const { balance } = useGameBalance();
  const [activeTab, setActiveTab] = useState<ProfileTab>('promocodes');
  // Убираем неиспользуемую переменную или добавляем _ перед именем
  // const [_showDeposit, _setShowDeposit] = useState(false);

  // Инвентарь
  const inventory = [
    { id: 1, name: 'Golden Pellet', price: 150, type: 'Pellet', rarity: 'rare' },
    { id: 2, name: 'Silver Pile', price: 80, type: 'Pile', rarity: 'uncommon' },
    { id: 3, name: 'Diamond Pellet', price: 300, type: 'Pellet', rarity: 'epic' },
    { id: 4, name: 'Bronze Pile', price: 40, type: 'Pile', rarity: 'common' },
  ];

  return (
    <div className="new-profile-page">
      {/* User Info */}
      <div className="profile-header card">
        <div className="profile-avatar">
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt={user.firstName} />
          ) : (
            <div className="avatar-placeholder">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2>{user?.firstName || 'User'}</h2>
          <p className="text-secondary">ID: {user?.id || '---'}</p>
          {user?.username && (
            <p className="text-secondary">@{user.username}</p>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="profile-balance card">
        <div className="balance-row">
          <div className="balance-item">
            <span className="balance-label">TON</span>
            <span className="balance-value">{balance.ton.toFixed(2)}</span>
          </div>
          <div className="balance-divider" />
          <div className="balance-item">
            <span className="balance-label">Stars</span>
            <span className="balance-value">{balance.stars.toFixed(0)}</span>
          </div>
        </div>
        <div className="balance-actions">
          <button className="btn-primary">Deposit</button>
          <button className="btn-secondary">Withdraw</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'promocodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('promocodes')}
        >
          Promocodes
        </button>
        <button
          className={`profile-tab ${activeTab === 'referals' ? 'active' : ''}`}
          onClick={() => setActiveTab('referals')}
        >
          Referals
        </button>
        <button
          className={`profile-tab ${activeTab === 'stacking' ? 'active' : ''}`}
          onClick={() => setActiveTab('stacking')}
        >
          Stacking
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'promocodes' && (
          <div className="promocodes-section card">
            <h3>Active Promocodes</h3>
            <div className="promocode-input-group">
              <input
                type="text"
                className="promocode-input"
                placeholder="Enter promo code"
              />
              <button className="btn-primary">Activate</button>
            </div>
            <div className="promocode-list">
              <div className="promocode-item">
                <span className="promocode-code">WELCOME50</span>
                <span className="promocode-reward">+50 Stars</span>
                <span className="promocode-status active">Active</span>
              </div>
              <div className="promocode-item">
                <span className="promocode-code">BONUS100</span>
                <span className="promocode-reward">+100 TON</span>
                <span className="promocode-status used">Used</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referals' && (
          <div className="referals-section card">
            <h3>Start making money with us</h3>
            <div className="referal-stats">
              <div className="referal-stat">
                <span className="stat-label">Commission</span>
                <span className="stat-value">50%</span>
              </div>
              <div className="referal-stat">
                <span className="stat-label">Referals</span>
                <span className="stat-value">12</span>
              </div>
              <div className="referal-stat">
                <span className="stat-label">Earned</span>
                <span className="stat-value">250 TON</span>
              </div>
            </div>
            <div className="referal-link-box">
              <input
                type="text"
                className="referal-link-input"
                value="https://t.me/bot?start=ref_ABC123"
                readOnly
              />
              <button className="btn-primary">Share</button>
            </div>
            <button className="btn-secondary withdraw-btn">Withdraw</button>
          </div>
        )}

        {activeTab === 'stacking' && (
          <div className="stacking-section card">
            <h3>Stacking</h3>
            <div className="stacking-info">
              <p>Stack your tokens and earn rewards</p>
              <div className="stacking-stats">
                <div className="stacking-stat">
                  <span className="stat-label">APY</span>
                  <span className="stat-value">12.5%</span>
                </div>
                <div className="stacking-stat">
                  <span className="stat-label">Stacked</span>
                  <span className="stat-value">0 TON</span>
                </div>
                <div className="stacking-stat">
                  <span className="stat-label">Reward</span>
                  <span className="stat-value">0 TON</span>
                </div>
              </div>
              <button className="btn-primary">Start Stacking</button>
            </div>
          </div>
        )}
      </div>

      {/* Inventory */}
      <div className="inventory-section card">
        <h3>🎒 Inventory</h3>
        <div className="inventory-grid">
          {inventory.map((item) => (
            <div key={item.id} className="inventory-item">
              <div className={`item-rarity ${item.rarity}`}>
                <span className="item-icon">📦</span>
              </div>
              <div className="item-info">
                <span className="item-name">{item.name}</span>
                <span className="item-type">{item.type}</span>
                <span className="item-price">{item.price} TON</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};