import React, { useState, useEffect, useCallback } from 'react';
import './Balance.css';

const BALANCE_KEY = 'app_balance';
const INITIAL_BONUS = 100;
const FAUCET_AMOUNT = 50;

const Balance: React.FC = () => {
  // Инициализируем состояние, читая из LocalStorage
  const [balance, setBalance] = useState<number>(() => {
    const storedBalance = localStorage.getItem(BALANCE_KEY);
    if (storedBalance) {
      return parseFloat(storedBalance);
    }
    // Стартовый бонус
    localStorage.setItem(BALANCE_KEY, INITIAL_BONUS.toString());
    return INITIAL_BONUS;
  });

  // Обновляем LocalStorage при каждом изменении баланса
  useEffect(() => {
    localStorage.setItem(BALANCE_KEY, balance.toString());
  }, [balance]);

  const handleFaucet = useCallback(() => {
    setBalance((prevBalance) => prevBalance + FAUCET_AMOUNT);
  }, []);

  return (
    <div className="balance-container">
      <div className="balance-header">Your Balance</div>
      <div className="balance-amount">
        {balance.toFixed(2)} <span className="balance-currency">USDT</span>
      </div>
      <button onClick={handleFaucet} className="faucet-button">
        Test Faucet (Get {FAUCET_AMOUNT} USDT)
      </button>
      <p className="balance-hint">
        This is a demo balance stored in your browser.
      </p>
    </div>
  );
};

export default Balance;