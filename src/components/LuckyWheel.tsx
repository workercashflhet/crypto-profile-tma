import React from 'react';
import { WheelSegment } from '../types/pvp';
import './LuckyWheel.css';

interface LuckyWheelProps {
  segments: WheelSegment[];
  rotationAngle: number;
  isSpinning: boolean;
  timeLeft: number;
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({ segments, rotationAngle, isSpinning, timeLeft }) => {
  if (segments.length === 0) {
    return (
      <div className="wheel-wrapper">
        <div className="wheel-container">
          <div className="wheel-empty">
            <div className="wheel-empty-text">Waiting for players...</div>
          </div>
          <div className="wheel-pointer">▼</div>
          <div className="wheel-center">
            <svg className="timer-circle" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="3"
                strokeDasharray={`${(timeLeft / 30) * 264} 264`}
                strokeLinecap="round" transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 1s linear' }} />
            </svg>
            <div className="timer-text">{timeLeft}s</div>
          </div>
        </div>
      </div>
    );
  }

  const createGradient = () => {
    const gradients = segments.map((segment) => {
      const startPercent = (segment.startAngle / 360) * 100;
      const endPercent = (segment.endAngle / 360) * 100;
      return `${segment.color} ${startPercent}% ${endPercent}%`;
    });
    return `conic-gradient(${gradients.join(', ')})`;
  };

  return (
    <div className="wheel-wrapper">
      <div className="wheel-container">
        <div 
          className={`wheel ${isSpinning ? 'spinning' : ''}`}
          style={{
            background: createGradient(),
            transform: `rotate(${rotationAngle}deg)`,
            transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {/* Аватарки игроков на колесе */}
          {segments.map((segment, index) => {
            const midAngle = (segment.startAngle + segment.endAngle) / 2;
            
            return (
              <div
                key={index}
                className="wheel-avatar-container"
                style={{
                  transform: `rotate(${midAngle}deg) translateY(-35%)`,
                }}
              >
                <img
                  src={segment.player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${segment.player.userId}`}
                  alt={segment.player.firstName}
                  className="wheel-player-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback${index}`;
                  }}
                />
              </div>
            );
          })}
        </div>
        
        {/* Таймер в центре */}
        <div className="wheel-center">
          <svg className="timer-circle" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={`${(timeLeft / 30) * 264} 264`}
              strokeLinecap="round" transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s linear' }} />
          </svg>
          <div className={`timer-text ${timeLeft <= 10 ? 'time-warning' : ''}`}>
            {timeLeft}s
          </div>
        </div>
        
        <div className="wheel-pointer">▼</div>
      </div>
    </div>
  );
};

export default LuckyWheel;