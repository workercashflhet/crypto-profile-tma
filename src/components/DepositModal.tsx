import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { CurrencyType } from '../types/pvp';
import { createTonTransfer } from '../services/tonService';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number, currency: CurrencyType) => void;
  balance: { ton: number; stars: number };
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDepositSuccess, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyType>('ton');
  const [step, setStep] = useState<'input' | 'sending' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setStep('input');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }

    setStep('sending');
    setError(null);

    try {
      if (currency === 'ton') {
        const tx = createTonTransfer(numAmount);
        
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: tx.to,
              amount: tx.value,
            },
          ],
        });
        setStep('success');
        onDepositSuccess(numAmount, currency);
        setTimeout(() => onClose(), 3000);
      } else {
        // Telegram Stars - открываем инвойс
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        
        if (tg?.openInvoice) {
          tg.openInvoice(
            `https://t.me/stars?star_count=${numAmount}`,
            (status: string) => {
              if (status === 'paid') {
                setStep('success');
                onDepositSuccess(numAmount, currency);
                setTimeout(() => onClose(), 3000);
              } else {
                setError('Payment was not completed');
                setStep('input');
              }
            }
          );
        } else {
          window.open(`https://t.me/stars?amount=${numAmount}`, '_blank');
          setStep('success');
          onDepositSuccess(numAmount, currency);
          setTimeout(() => onClose(), 3000);
        }
      }
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err?.message || 'Transaction failed');
      setStep('input');
    }
  };

  const handleClose = () => {
    setAmount('');
    setStep('input');
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 'input' && (
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
                className={`currency-btn ${currency === 'stars' ? 'active' : ''}`}
                onClick={() => setCurrency('stars')}
              >
                ⭐ Stars
              </button>
            </div>

            <div className="deposit-balance">
              Balance: {currency === 'ton' ? balance.ton.toFixed(1) : balance.stars.toFixed(0)} {currency === 'ton' ? 'TON' : 'Stars'}
            </div>

            <input
              type="number"
              className="deposit-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
            />

            {error && <div className="deposit-error">{error}</div>}

            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || !wallet}
            >
              {!wallet 
                ? 'Connect wallet to deposit' 
                : `Deposit ${amount || '0'} ${currency === 'ton' ? 'TON' : 'Stars'}`}
            </button>

            <div className="deposit-info-box">
              <p className="deposit-info-title">
                {currency === 'ton' 
                  ? 'TON will be sent to app wallet'
                  : 'Stars invoice will be generated'}
              </p>
            </div>
          </>
        )}

        {step === 'sending' && (
          <>
            <h2 className="modal-title">Processing</h2>
            <div className="sending-animation">
              <div className="spinner" />
              <p>{currency === 'ton' ? 'Confirm transaction...' : 'Opening Stars invoice...'}</p>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <h2 className="modal-title">✅ Success!</h2>
            <div className="success-info">
              <p>Deposited {amount} {currency === 'ton' ? 'TON' : 'Stars'}</p>
            </div>
            <button className="close-button" onClick={handleClose}>Close</button>
          </>
        )}

        {step === 'input' && (
          <button className="modal-close" onClick={handleClose}>✕</button>
        )}
      </div>
    </div>
  );
};

export default DepositModal;