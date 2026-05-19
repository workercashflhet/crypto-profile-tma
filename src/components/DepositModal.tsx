import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { CurrencyType } from '../types/pvp';
import { OWNER_WALLET, createTonTransfer, createUsdtTransfer } from '../services/tonService';
import { getTokenPrices, tonToUsd } from '../services/priceService';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (amount: number, currency: CurrencyType) => void;
  balance: { ton: number; usdt: number };
}

const STAR_RATES = {
  ton: 50, // 50 звезд = 1 TON
  usdt: 50, // 50 звезд = 1 USDT
};

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDepositSuccess, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyType>('ton');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stars'>('wallet');
  const [step, setStep] = useState<'input' | 'sending' | 'success'>('input');
  const [error, setError] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const prices = getTokenPrices();

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  
  // Расчет стоимости в звездах
  const starsNeeded = paymentMethod === 'stars' 
    ? Math.ceil(numAmount * STAR_RATES[currency])
    : 0;

  const handleDeposit = async () => {
    if (!numAmount || numAmount <= 0) return;

    setStep('sending');
    setError(null);

    try {
      if (paymentMethod === 'wallet') {
        // Депозит через TON кошелек
        if (!wallet) {
          setError('Please connect your wallet first');
          setStep('input');
          return;
        }

        if (currency === 'ton') {
          const tx = createTonTransfer(numAmount);
          await tonConnectUI.sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{ address: tx.to, amount: tx.value }],
          });
        } else {
          const tx = await createUsdtTransfer(wallet.account.address, numAmount);
          await tonConnectUI.sendTransaction({
            validUntil: Math.floor(Date.now() / 1000) + 300,
            messages: [{ address: tx.to, amount: tx.value, payload: tx.payload }],
          });
        }
      } else {
        // Депозит через Stars
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        
        if (!tg) {
          setError('Telegram WebApp not available');
          setStep('input');
          return;
        }

        // Открываем инвойс через Telegram Stars API
        tg.openInvoice({
          title: `${numAmount} ${currency.toUpperCase()}`,
          description: `Deposit to game balance`,
          payload: JSON.stringify({
            type: 'deposit',
            currency,
            amount: numAmount,
          }),
          currency: 'XTR',
          prices: [{
            label: `${numAmount} ${currency.toUpperCase()}`,
            amount: starsNeeded,
          }],
        }, (status: string) => {
          if (status === 'paid') {
            // Оплата успешна
            setStep('success');
            onDepositSuccess(numAmount, currency);
            setTimeout(() => onClose(), 2000);
          } else if (status === 'cancelled') {
            setError('Payment cancelled');
            setStep('input');
          } else {
            setError('Payment failed');
            setStep('input');
          }
        });
        return; // Не закрываем модалку, ждем колбэк
      }

      setStep('success');
      onDepositSuccess(numAmount, currency);
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
            
            {/* Выбор способа оплаты */}
            <div className="payment-method-toggle">
              <button
                className={`method-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('wallet')}
              >
                💼 Wallet
              </button>
              <button
                className={`method-btn ${paymentMethod === 'stars' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stars')}
              >
                ⭐ Stars
              </button>
            </div>

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

            {paymentMethod === 'stars' && numAmount > 0 && (
              <div className="stars-info">
                <p>Cost: <strong>{starsNeeded} ⭐ Stars</strong></p>
                <p className="stars-rate">Rate: 1 {currency.toUpperCase()} = {STAR_RATES[currency]} Stars</p>
              </div>
            )}

            {paymentMethod === 'wallet' && numAmount > 0 && (
              <div className="wallet-info-box">
                <p className="wallet-info-title">Destination:</p>
                <p className="wallet-info-address">{OWNER_WALLET.slice(0, 8)}...{OWNER_WALLET.slice(-6)}</p>
              </div>
            )}

            {error && <div className="deposit-error">{error}</div>}

            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={!amount || numAmount <= 0 || (paymentMethod === 'wallet' && !wallet)}
            >
              {paymentMethod === 'wallet' && !wallet 
                ? 'Connect wallet to deposit' 
                : paymentMethod === 'stars'
                  ? `Pay ${starsNeeded} ⭐ Stars`
                  : `Deposit ${amount} ${currency.toUpperCase()}`
              }
            </button>
          </>
        )}

        {step === 'sending' && (
          <>
            <h2 className="modal-title">
              {paymentMethod === 'stars' ? 'Opening Invoice...' : 'Sending Transaction...'}
            </h2>
            <div className="sending-animation">
              <div className="spinner" />
              <p>{paymentMethod === 'stars' 
                ? 'Please complete payment in Telegram' 
                : 'Please confirm in your wallet'}
              </p>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <h2 className="modal-title">✅ Success!</h2>
            <div className="success-info">
              <p>Deposited {amount} {currency.toUpperCase()}</p>
            </div>
            <button className="close-button" onClick={handleClose}>
              Close
            </button>
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