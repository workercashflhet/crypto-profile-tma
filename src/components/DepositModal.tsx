import React, { useState } from 'react';
import { CurrencyType } from '../types/pvp';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, currency: CurrencyType) => void;
  balance: { ton: number; usdt: number };
}

const OWNER_WALLET = 'UQC5ZUl4Qobq69CgLi7tg-8y6aOwVilc5b82jJFZShtnetrw';

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDeposit, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyType>('ton');
  const [step, setStep] = useState<'input' | 'confirm'>('input');

  if (!isOpen) return null;

  const handleDeposit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
      onDeposit(numAmount, currency);
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setAmount('');
    setStep('input');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 'input' ? (
          <>
            <h2 className="modal-title">Deposit Funds</h2>
            
            <div className="currency-toggle">
              <button
                className={`currency-btn ${currency === 'ton' ? 'active' : ''}`}
                onClick={() => setCurrency('ton')}
              >
                💎 TON
              </button>
              <button
                className={`currency-btn ${currency === 'usdt' ? 'active' : ''}`}
                onClick={() => setCurrency('usdt')}
              >
                💵 USDT
              </button>
            </div>

            <div className="deposit-balance">
              Balance: {currency === 'ton' ? balance.ton.toFixed(1) : balance.usdt.toFixed(1)} {currency.toUpperCase()}
            </div>

            <input
              type="number"
              className="deposit-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
            />

            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Deposit {amount || '0'} {currency.toUpperCase()}
            </button>

            <p className="deposit-info">
              Funds will be sent to app wallet via TON transaction
            </p>
          </>
        ) : (
          <>
            <h2 className="modal-title">Confirm Transaction</h2>
            
            <div className="confirm-info">
              <p>Send <strong>{amount} {currency.toUpperCase()}</strong></p>
              <p>to wallet:</p>
              <div className="wallet-address-box">
                <code>{OWNER_WALLET.slice(0, 12)}...{OWNER_WALLET.slice(-8)}</code>
                <button 
                  onClick={() => navigator.clipboard.writeText(OWNER_WALLET)}
                  className="copy-btn"
                >
                  📋
                </button>
              </div>
              <p className="confirm-note">
                After sending, your balance will be updated automatically
              </p>
            </div>

            <button className="close-button" onClick={handleClose}>
              Close
            </button>
          </>
        )}

        <button className="modal-close" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default DepositModal;