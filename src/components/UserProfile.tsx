import React from 'react';
import { useTelegramUser } from '../hooks/useTelegramUser';
import premiumStarIcon from '../assets/premiumStar.svg';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { user, isLoading } = useTelegramUser();

  if (isLoading) {
    return <div className="profile-container">Loading user data...</div>;
  }

  if (!user) {
    return <div className="profile-container">Could not load user profile.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-avatar">
        {/* Если есть photoUrl, показываем аватар, иначе placeholder */}
        {user.photoUrl ? (
          <img src={user.photoUrl} alt={`${user.firstName}'s avatar`} />
        ) : (
          <div className="avatar-placeholder">{user.firstName.charAt(0)}</div>
        )}
      </div>
      <div className="profile-info">
        <div className="profile-name">
          <h2>
            {user.firstName} {user.lastName || ''}
          </h2>
          {/* Отображаем иконку Premium только если пользователь премиум */}
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