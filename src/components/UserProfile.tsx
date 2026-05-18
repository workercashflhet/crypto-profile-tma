import React, { useState, useEffect } from 'react';
import { useTelegramUser } from '../hooks/useTelegramUser';
import premiumStarIcon from '../assets/premiumStar.svg';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, isLoading, loadUserPhoto } = useTelegramUser();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    if (user && !user.photoUrl && !isLoading) {
      loadUserPhoto();
    }
  }, [user?.id]);

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

  // Формируем отображаемое имя
  const displayName = user.firstName || 'User';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
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
  );
};

export default UserProfile;