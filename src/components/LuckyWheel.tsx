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
  // Если нет сегментов, показываем пустое колесо
  if (segments.length === 0) {
    return (
      <div className="wheel-wrapper">
        <div className="wheel-container">
          <div className="wheel-empty">
            <div className="wheel-empty-text">Waiting for players...</div>
          </div>
          <div className="wheel-pointer">▼</div>
          {/* Таймер в центре */}
          <div className="wheel-timer">
            <svg className="timer-circle" viewBox="0 0 100 100">
              <circle
                className="timer-bg"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
              />
              <circle
                className="timer-progress"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={`${(timeLeft / 30) * 283} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <div className="timer-text">{timeLeft}s</div>
          </div>
        </div>
      </div>
    );
  }

  // Создаем градиент для колеса
  const createGradient = () => {
    if (segments.length === 0) return '';

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
          {segments.map((segment, index) => {
            const midAngle = (segment.startAngle + segment.endAngle) / 2;
            
            return (
              <div
                key={index}
                className="wheel-segment-label"
                style={{
                  transform: `rotate(${midAngle}deg) translateY(-40%)`,
                }}
              >
                <span className="segment-player-name">
                  {segment.player.firstName}
                </span>
                <span className="segment-bet">{segment.player.bet} TON</span>
              </div>
            );
          })}
        </div>
        
        {/* Таймер в центре колеса */}
        <div className="wheel-center">
          <svg className="timer-circle" viewBox="0 0 100 100">
            <circle
              className="timer-bg"
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
            />
            <circle
              className="timer-progress"
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeDasharray={`${(timeLeft / 30) * 264} 264`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s linear' }}
            />
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