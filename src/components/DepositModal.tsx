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
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stars'>('wallet');
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
      if (currency === 'ton' && paymentMethod === 'wallet') {
        if (!wallet) { setError('Please connect your wallet first'); setStep('input'); return; }
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: OWNER_WALLET, amount: (numAmount * 1_000_000_000).toString() }],
        });
      } else {
        // @ts-ignore
        const tg = window.Telegram?.WebApp;
        if (!tg) { setError('Telegram WebApp not available'); setStep('input'); return; }
        tg.openInvoice({
          title: `${numAmount} ${currency === 'stars' ? 'Stars' : 'TON'}`,
          description: `Deposit to game balance`,
          payload: JSON.stringify({ type: 'deposit', currency, amount: numAmount }),
          currency: 'XTR',
          prices: [{ label: `${numAmount} ${currency === 'stars' ? 'Stars' : 'TON'}`, amount: numAmount }],
        }, (status: string) => {
          if (status === 'paid') { setStep('success'); onDepositSuccess(numAmount, currency); setTimeout(() => onClose(), 2000); }
          else { setError('Payment failed or cancelled'); setStep('input'); }
        });
        return;
      }

      setStep('success');
      onDepositSuccess(numAmount, currency);
      setTimeout(() => onClose(), 3000);
    } catch (err: any) {
      setError(err?.message || 'Transaction failed');
      setStep('input');
    }
  };

  const handleClose = () => { setAmount(''); setStep('input'); setError(null); onClose(); };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 'input' && (
          <>
            <h2 className="modal-title">Deposit Funds</h2>
            <div className="currency-toggle">
              <button className={`currency-btn ${currency === 'ton' ? 'active' : ''}`} onClick={() => setCurrency('ton')}>💎 TON</button>
              <button className={`currency-btn ${currency === 'stars' ? 'active' : ''}`} onClick={() => setCurrency('stars')}>⭐ Stars</button>
            </div>
            {currency === 'ton' && (
              <div className="payment-method-toggle">
                <button className={`method-btn ${paymentMethod === 'wallet' ? 'active' : ''}`} onClick={() => setPaymentMethod('wallet')}>💼 Wallet</button>
                <button className={`method-btn ${paymentMethod === 'stars' ? 'active' : ''}`} onClick={() => setPaymentMethod('stars')}>⭐ Stars</button>
              </div>
            )}
            <div className="deposit-balance">
              Balance: {currency === 'ton' ? balance.ton.toFixed(1) : balance.stars.toFixed(0)} {currency === 'ton' ? 'TON' : '⭐'}
            </div>
            <input type="number" className="deposit-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" min="0" />
            {error && <div className="deposit-error">{error}</div>}
            <button className="deposit-button" onClick={handleDeposit} disabled={!amount || numAmount <= 0 || (currency === 'ton' && paymentMethod === 'wallet' && !wallet)}>
              {currency === 'ton' && paymentMethod === 'wallet' && !wallet ? 'Connect wallet' : `Deposit ${amount || '0'} ${currency === 'ton' ? 'TON' : '⭐'}`}
            </button>
          </>
        )}
        {step === 'sending' && (
          <>
            <h2 className="modal-title">Processing...</h2>
            <div className="sending-animation"><div className="spinner" /><p>Please confirm...</p></div>
          </>
        )}
        {step === 'success' && (
          <>
            <h2 className="modal-title">✅ Success!</h2>
            <div className="success-info"><p>Deposited {amount} {currency === 'ton' ? 'TON' : '⭐'}</p></div>
            <button className="close-button" onClick={handleClose}>Close</button>
          </>
        )}
        {step === 'input' && <button className="modal-close" onClick={handleClose}>✕</button>}
      </div>
    </div>
  );
};

export default DepositModal;