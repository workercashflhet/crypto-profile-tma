import React, { useState } from 'react';
import { useTelegramUser } from '../hooks/useTelegramUser';
import premiumStarIcon from '../assets/premiumStar.svg';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, isLoading } = useTelegramUser();
  const [avatarError, setAvatarError] = useState(false);

  if (isLoading) {
    return <div className="profile-container">Loading user data...</div>;
  }

  if (!user) {
    return <div className="profile-container">Could not load user profile.</div>;
  }

  // Функция для получения URL аватарки
  const getAvatarUrl = (): string => {
    if (avatarError || !user.photoUrl) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
    }
    return user.photoUrl;
  };

  return (
    <div className="profile-container">
      <div className="profile-avatar">
        <img 
          src={getAvatarUrl()} 
          alt={`${user.firstName}'s avatar`}
          onError={() => setAvatarError(true)}
        />
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