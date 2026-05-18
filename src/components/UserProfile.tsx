import React, { useState, useEffect } from 'react';
import { useTelegramUser } from '../hooks/useTelegramUser';
import premiumStarIcon from '../assets/premiumStar.svg';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, isLoading, loadUserPhoto } = useTelegramUser();
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Пытаемся загрузить фото при монтировании
  useEffect(() => {
    if (user && !user.photoUrl && !isLoading) {
      loadUserPhoto();
    }
  }, [user?.id]);

  if (isLoading) {
    return <div className="profile-container">Loading user data...</div>;
  }

  if (!user) {
    return <div className="profile-container">Could not load user profile.</div>;
  }

  // Формируем URL аватарки
  const getAvatarUrl = (): string => {
    if (avatarError) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
    }
    
    if (user.photoUrl) {
      return user.photoUrl;
    }
    
    // Пробуем стандартный URL Telegram
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

  return (
    <div className="profile-container">
      <div className="profile-avatar">
        <img 
          src={getAvatarUrl()} 
          alt={`${user.firstName}'s avatar`}
          onError={handleAvatarError}
          onLoad={handleAvatarLoad}
          style={{ 
            display: avatarLoaded || avatarError ? 'block' : 'none',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
        {!avatarLoaded && !avatarError && (
          <div className="avatar-placeholder">
            {user.firstName.charAt(0)}
          </div>
        )}
        {avatarError && (
          <div className="avatar-placeholder">
            {user.firstName.charAt(0)}
          </div>
        )}
      </div>
      <div className="profile-info">
        <div className="profile-name">
          <h2>
            {user.firstName} {user.lastName || ''}
          </h2>
          {user.isPremium && (
            <span className="premium-badge" title="Telegram Premium">
              <img src={premiumStarIcon} alt="Premium Star" />
            </span>
          )}
        </div>
        {user.username && (
          <p className="profile-username">@{user.username}</p>
        )}
        <p className="profile-id">ID: {user.id}</p>
      </div>
    </div>
  );
};

export default UserProfile;