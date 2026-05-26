import React, { useState, useEffect } from 'react';
import { useTelegramUser } from '../hooks/useTelegramUser';
import { useReferral } from '../hooks/useReferral';
import premiumStarIcon from '../assets/premiumStar.svg';
import './UserProfile.css';
import './ReferralSystem.css';

const UserProfile: React.FC = () => {
  const { user, isLoading, loadUserPhoto } = useTelegramUser();
  const { referralCode, referralLink, getReferralStats, referralData } = useReferral();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnedTon: 0,
    totalEarnedStars: 0,
    availableTon: 0,
    availableStars: 0,
  });

  useEffect(() => {
    if (user && !user.photoUrl && !isLoading) {
      loadUserPhoto();
    }
  }, [user?.id]);

  useEffect(() => {
    if (referralData) {
      const stats = getReferralStats();
      setReferralStats(stats);
    }
  }, [referralData, getReferralStats]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return <div className="profile-container">Loading...</div>;
  }

  if (!user) {
    return <div className="profile-container">Could not load user profile.</div>;
  }

  const getAvatarUrl = (): string => {
    if (avatarError) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
    }
    
    if (user.photoUrl) {
      return user.photoUrl;
    }
    
    return `https://t.me/i/userpic/320/${user.id}.jpg`;
  };

  const handleAvatarError = () => {
    if (!avatarError) {
      setAvatarError(true);
    }
  };

  const handleAvatarLoad = () => {
    setAvatarLoaded(true);
  };

  const displayName = user.firstName || 'User';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <>
      <div className="profile-container">
        <div className="profile-avatar">
          {!avatarError && (
            <img 
              src={getAvatarUrl()} 
              alt={fullName}
              onError={handleAvatarError}
              onLoad={handleAvatarLoad}
              style={{ 
                display: avatarLoaded ? 'block' : 'none',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          )}
          {(!avatarLoaded || avatarError) && (
            <div className="avatar-placeholder">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name">
            <h2>{fullName}</h2>
            {user.isPremium && (
              <span className="premium-badge" title="Telegram Premium">
                <img src={premiumStarIcon} alt="Premium Star" />
              </span>
            )}
          </div>
          {user.username && (
            <p className="profile-username">@{user.username}</p>
          )}
        </div>
      </div>

      {/* Реферальная система */}
      <div className="referral-container">
        <div className="referral-header">
          <h3>🎁 Referral Program</h3>
          <span className="referral-badge">10% Reward</span>
        </div>

        <div className="referral-stats-grid">
          <div className="referral-stat-card">
            <div className="referral-stat-value">{referralStats.totalReferrals}</div>
            <div className="referral-stat-label">Total Referrals</div>
          </div>
          <div className="referral-stat-card">
            <div className="referral-stat-value">{referralStats.totalEarnedTon.toFixed(2)} TON</div>
            <div className="referral-stat-label">Earned TON</div>
          </div>
          <div className="referral-stat-card">
            <div className="referral-stat-value">{referralStats.totalEarnedStars.toFixed(0)} ⭐</div>
            <div className="referral-stat-label">Earned Stars</div>
          </div>
          <div className="referral-stat-card">
            <div className="referral-stat-value">
              {referralStats.availableTon.toFixed(2)} TON + {referralStats.availableStars.toFixed(0)} ⭐
            </div>
            <div className="referral-stat-label">Available to Claim</div>
          </div>
        </div>

        <div className="referral-code-section">
          <div className="referral-code-label">Your Referral Code</div>
          <div className="referral-code-wrapper">
            <div className="referral-code">{referralCode}</div>
            <button 
              className="referral-button secondary"
              onClick={() => copyToClipboard(referralCode)}
            >
              📋 Copy
            </button>
          </div>
        </div>

        <div className="referral-link-section">
          <div className="referral-link-label">Your Referral Link</div>
          <div className="referral-link-wrapper">
            <div className="referral-link">{referralLink}</div>
            <button 
              className="referral-button secondary"
              onClick={() => copyToClipboard(referralLink)}
            >
              📋 Copy
            </button>
          </div>
        </div>

        {referralData?.referrals && referralData.referrals.length > 0 && (
          <div className="referrals-list">
            <div className="referral-code-label" style={{ marginBottom: '12px' }}>
              Your Referrals ({referralData.referrals.length})
            </div>
            {referralData.referrals.map((ref, index) => (
              <div key={index} className="referral-item">
                <div className="referral-info">
                  <div className="referral-name">{ref.firstName}</div>
                  {ref.username && (
                    <div className="referral-username">@{ref.username}</div>
                  )}
                </div>
                <div className="referral-earned">
                  <div className="referral-earned-ton">+{ref.earnedTon.toFixed(2)} TON</div>
                  <div className="referral-earned-stars">+{ref.earnedStars.toFixed(0)} ⭐</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!referralData?.referrals || referralData.referrals.length === 0) && (
          <div className="referral-empty">
            <p>No referrals yet</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>
              Share your code and earn 10% from your friends' bets!
            </p>
          </div>
        )}
      </div>

      {showCopyNotification && (
        <div className="copy-notification">
          ✅ Copied to clipboard!
        </div>
      )}
    </>
  );
};

export default UserProfile;