import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number, currency: 'ton' | 'stars') => void;
  balance: { ton: number; stars: number };
}

const OWNER_WALLET = 'UQC5ZUl4Qobq69CgLi7tg-8y6aOwVilc5b82jJFZShtnetrw';

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDepositSuccess, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'ton' | 'stars'>('ton');
  const [step, setStep] = useState<'input' | 'sending' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleDeposit = async () => {
    if (!numAmount || numAmount <= 0) return;
    setStep('sending');
    setError(null);

    try {
      if (currency === 'ton') {
        // Депозит через TON кошелек
        if (!wallet) {
          setError('Please connect your wallet first');
          setStep('input');
          return;
        }

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: OWNER_WALLET,
              amount: (numAmount * 1_000_000_000).toString(), // Конвертируем TON в наноTON
            },
          ],
        });
      } else {
        // Депозит через Telegram Stars
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        
        if (!tg) {
          setError('Telegram WebApp not available');
          setStep('input');
          return;
        }

        // Отправляем инвойс
        tg.openInvoice({
          title: `Deposit ${numAmount} Stars`,
          description: `Add ${numAmount} Stars to your game balance`,
          payload: JSON.stringify({
            type: 'deposit',
            currency: 'stars',
            amount: numAmount,
          }),
          currency: 'XTR',
          prices: [{ 
            label: `${numAmount} Stars`, 
            amount: Math.floor(numAmount) 
          }],
        }, (status: string) => {
          if (status === 'paid') {
            setStep('success');
            onDepositSuccess(numAmount, 'stars');
            setTimeout(() => onClose(), 2000);
          } else if (status === 'cancelled') {
            setError('Payment cancelled');
            setStep('input');
          } else {
            setError('Payment failed');
            setStep('input');
          }
        });
        return;
      }

      setStep('success');
      onDepositSuccess(numAmount, 'ton');
      setTimeout(() => onClose(), 3000);
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
            
            {/* Выбор валюты */}
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
              Your balance: {currency === 'ton' ? `${balance.ton.toFixed(1)} TON` : `${balance.stars.toFixed(0)} ⭐`}
            </div>

            <input
              type="number"
              className="deposit-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount in ${currency === 'ton' ? 'TON' : 'Stars'}`}
              min="0"
            />

            {currency === 'ton' && !wallet && (
              <div className="deposit-info-text">
                ⚠️ You need to connect your TON wallet first (go to Profile tab)
              </div>
            )}

            {error && <div className="deposit-error">{error}</div>}

            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={!amount || numAmount <= 0 || (currency === 'ton' && !wallet)}
            >
              {currency === 'ton' && !wallet 
                ? 'Connect wallet in Profile' 
                : currency === 'ton'
                  ? `Send ${amount} TON via wallet`
                  : `Pay ${amount || '0'} ⭐ Stars`
              }
            </button>

            {currency === 'ton' && (
              <p className="deposit-info-text">
                TON will be sent to: {OWNER_WALLET.slice(0, 8)}...{OWNER_WALLET.slice(-6)}
              </p>
            )}
          </>
        )}

        {step === 'sending' && (
          <>
            <h2 className="modal-title">
              {currency === 'ton' ? 'Confirm in Wallet' : 'Open Invoice'}
            </h2>
            <div className="sending-animation">
              <div className="spinner" />
              <p>
                {currency === 'ton' 
                  ? 'Please confirm the transaction in your TON wallet...' 
                  : 'Please complete the payment in Telegram...'
                }
              </p>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <h2 className="modal-title">✅ Success!</h2>
            <div className="success-info">
              <p>Deposited {amount} {currency === 'ton' ? 'TON' : '⭐'}</p>
              <p>Your balance has been updated</p>
            </div>
            <button className="close-button" onClick={handleClose}>
              Close
            </button>
          </>
        )}

        <button className="modal-close" onClick={handleClose}>✕</button>
      </div>
    </div>
  );
};

export default DepositModal;