import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { CurrencyType } from '../types/pvp';
import { Address, beginCell, toNano } from '@ton/ton';
import './DepositModal.css';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number, currency: CurrencyType) => void;
  balance: { ton: number; usdt: number };
}

const OWNER_WALLET = 'UQC5ZUl4Qobq69CgLi7tg-8y6aOwVilc5b82jJFZShtnetrw';
const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onDeposit, balance }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<CurrencyType>('ton');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing'>('input');
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  if (!isOpen) return null;

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) return;

    if (!wallet) {
      alert('Please connect your wallet first');
      return;
    }

    setStep('processing');

    try {
      if (currency === 'ton') {
        // Прямой перевод TON
        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: OWNER_WALLET,
              amount: toNano(numAmount).toString(),
            },
          ],
        };

        await tonConnectUI.sendTransaction(transaction);
        onDeposit(numAmount, currency);
        setStep('input');
        setAmount('');
        onClose();
      } else {
        // Перевод USDT (Jetton)
        const ownerAddress = Address.parse(OWNER_WALLET);
        
        const body = beginCell()
          .storeUint(0xf8a7ea5, 32) // opcode transfer
          .storeUint(0, 64) // query_id
          .storeCoins(toNano(numAmount)) // amount in nanoUSDT
          .storeAddress(ownerAddress) // destination
          .storeAddress(ownerAddress) // response_destination
          .storeBit(false) // custom payload
          .storeCoins(1) // forward amount
          .storeBit(false) // forward payload
          .endCell();

        const transaction = {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: USDT_MASTER,
              amount: toNano(0.05).toString(), // Комиссия за перевод jettons
              payload: body.toBoc().toString('base64'),
            },
          ],
        };

        await tonConnectUI.sendTransaction(transaction);
        onDeposit(numAmount, currency);
        setStep('input');
        setAmount('');
        onClose();
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setStep('confirm');
      alert('Transaction failed. Please try again.');
    }
  };

  const handleContinue = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0) {
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
              step="0.1"
            />

            <button
              className="deposit-button"
              onClick={handleContinue}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              Continue
            </button>

            {!wallet && (
              <p className="deposit-warning">
                ⚠️ Connect your TON wallet first in Profile tab
              </p>
            )}
          </>
        )}

        {step === 'confirm' && (
          <>
            <h2 className="modal-title">Confirm Deposit</h2>
            
            <div className="confirm-details">
              <div className="confirm-row">
                <span>Amount:</span>
                <strong>{amount} {currency.toUpperCase()}</strong>
              </div>
              <div className="confirm-row">
                <span>To wallet:</span>
                <code className="confirm-address">{OWNER_WALLET.slice(0, 8)}...{OWNER_WALLET.slice(-6)}</code>
              </div>
              {currency === 'usdt' && (
                <div className="confirm-row">
                  <span>Network fee:</span>
                  <strong>~0.05 TON</strong>
                </div>
              )}
            </div>

            <button className="deposit-button" onClick={handleDeposit}>
              💳 Pay with TON Wallet
            </button>
            
            <button className="back-button" onClick={() => setStep('input')}>
              ← Back
            </button>
          </>
        )}

        {step === 'processing' && (
          <>
            <h2 className="modal-title">Processing...</h2>
            <div className="processing-spinner" />
            <p className="processing-text">
              Check your TON wallet to confirm the transaction
            </p>
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