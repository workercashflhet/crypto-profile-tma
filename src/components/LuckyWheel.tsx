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
          {/* Таймер на пустом колесе */}
          <div className="wheel-center-solid">
            <svg className="timer-circle-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="#1a1a2e" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
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
    // Сортируем сегменты по startAngle для правильного порядка
    const sortedSegments = [...segments].sort((a, b) => a.startAngle - b.startAngle);
    
    const gradients = sortedSegments.map((segment, index) => {
      const startPercent = (segment.startAngle / 360) * 100;
      const endPercent = (segment.endAngle / 360) * 100;
      
      // Обеспечиваем точные границы без наложений
      if (index === 0 && startPercent > 0) {
        return `${segment.color} 0% ${endPercent}%`;
      }
      if (index === sortedSegments.length - 1 && endPercent < 100) {
        return `${segment.color} ${startPercent}% 100%`;
      }
      
      return `${segment.color} ${startPercent}% ${endPercent}%`;
    });

    return `conic-gradient(from 0deg, ${gradients.join(', ')})`;
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
          {/* Аватарки игроков - ближе к краю */}
          {segments.map((segment, index) => {
            // Центр сектора в градусах
            const midAngle = segment.startAngle + (segment.endAngle - segment.startAngle) / 2;
            
            return (
              <div
                key={index}
                className="wheel-avatar-container"
                style={{
                  transform: `rotate(${midAngle}deg) translateY(-80px)`,
                }}
              >
                <div className="avatar-wrapper">
                  <img
                    src={segment.player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=player${segment.player.userId}`}
                    alt={segment.player.firstName}
                    className="wheel-player-avatar"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback${index}`;
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Таймер в центре - НЕ прозрачный */}
        <div className="wheel-center-solid">
          <svg className="timer-circle-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="#1a1a2e" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
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