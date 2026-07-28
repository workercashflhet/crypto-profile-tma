// src/components/ThemeToggle.tsx
import React from 'react';

interface ThemeToggleProps {
  isNewTheme: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isNewTheme, onToggle }) => {
  return (
    <button 
      onClick={onToggle}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '10px',
        zIndex: 999,
        background: '#34C759',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        fontSize: '20px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(52, 199, 89, 0.4)',
      }}
    >
      {isNewTheme ? '🌙' : '✨'}
    </button>
  );
};