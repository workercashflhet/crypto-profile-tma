import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { CurrencyType } from '../types/pvp';
import { OWNER_WALLET, USDT_MASTER, createTonTransfer, createUsdtTransfer } from '../services/tonService';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number, currency: CurrencyType) => void;
  balance: { ton: number; usdt: number };
}

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDepositSuccess, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyType>('ton');
  const [step, setStep] = useState<'input' | 'sending' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  // Сброс состояния при закрытии
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
        // Отправка TON напрямую на адрес овнера
        const tx = createTonTransfer(numAmount);
        
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300, // 5 минут
          messages: [
            {
              address: tx.to,
              amount: tx.value,
            },
          ],
        });
      } else {
        // Отправка USDT через jetton-контракт
        const tx = await createUsdtTransfer(wallet.account.address, numAmount);
        
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: tx.to, // Адрес jetton-мастера USDT
              amount: tx.value, // Комиссия 0.05 TON
              payload: tx.payload, // Данные для jetton-трансфера
            },
          ],
        });
      }

      // Транзакция успешна
      setStep('success');
      onDepositSuccess(numAmount, currency);
      
      // Автозакрытие через 3 секунды
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      console.error('Deposit error:', err);
      setError(err?.message || 'Transaction failed. Please try again.');
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

            {error && <div className="deposit-error">{error}</div>}

            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={!amount || parseFloat(amount) <= 0 || !wallet}
            >
              {!wallet ? 'Connect wallet to deposit' : `Deposit ${amount || '0'} ${currency.toUpperCase()}`}
            </button>

            <div className="deposit-info-box">
              <p className="deposit-info-title">How it works:</p>
              <p className="deposit-info-text">
                {currency === 'ton' 
                  ? `TON will be sent directly to app wallet`
                  : `USDT will be sent via TON blockchain to app wallet`
                }
              </p>
              <p className="deposit-info-address">
                Destination: {OWNER_WALLET.slice(0, 8)}...{OWNER_WALLET.slice(-6)}
              </p>
            </div>
          </>
        )}

        {step === 'sending' && (
          <>
            <h2 className="modal-title">Sending Transaction</h2>
            <div className="sending-animation">
              <div className="spinner" />
              <p>Please confirm the transaction in your wallet...</p>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <h2 className="modal-title">✅ Success!</h2>
            <div className="success-info">
              <p>Deposited {amount} {currency.toUpperCase()}</p>
              <p>Balance will update automatically</p>
            </div>
            <button className="close-button" onClick={handleClose}>
              Close
            </button>
          </>
        )}

        {step === 'input' && (
          <button className="modal-close" onClick={handleClose}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default DepositModal;