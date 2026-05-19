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
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleDeposit = async () => {
    if (!isValidAmount) return;

    if (!wallet) {
      alert('Please connect your wallet in Profile tab first');
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
              amount: toNano(parsedAmount).toString(),
            },
          ],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        
        // Проверяем результат транзакции
        if (result && result.boc) {
          // Транзакция успешна - пополняем баланс
          onDeposit(parsedAmount, currency);
          setStep('success');
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      } else {
        // Перевод USDT (Jetton)
        const ownerAddress = Address.parse(OWNER_WALLET);
        
        const body = beginCell()
          .storeUint(0xf8a7ea5, 32) // opcode transfer
          .storeUint(0, 64) // query_id
          .storeCoins(toNano(parsedAmount)) // amount in nanoUSDT
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
              amount: toNano(0.05).toString(),
              payload: body.toBoc().toString('base64'),
            },
          ],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        
        if (result && result.boc) {
          onDeposit(parsedAmount, currency);
          setStep('success');
          setTimeout(() => {
            handleClose();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      setStep('input');
      alert('Transaction failed. Please try again.');
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

            <div className="deposit-info-box">
              <div className="deposit-info-row">
                <span>To wallet:</span>
                <code>{OWNER_WALLET.slice(0, 6)}...{OWNER_WALLET.slice(-4)}</code>
              </div>
              {currency === 'usdt' && (
                <div className="deposit-info-row">
                  <span>Network fee:</span>
                  <span>~0.05 TON</span>
                </div>
              )}
            </div>

            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={!isValidAmount}
            >
              💳 Pay with TON Wallet {isValidAmount ? `(${parsedAmount} ${currency.toUpperCase()})` : ''}
            </button>

            {!wallet && (
              <p className="deposit-warning">
                ⚠️ Connect your TON wallet first in Profile tab
              </p>
            )}
          </>
        )}

        {step === 'processing' && (
          <>
            <h2 className="modal-title">Processing Payment</h2>
            <div className="processing-spinner" />
            <p className="processing-text">
              Confirm the transaction in your TON wallet...
            </p>
            <div className="processing-amount">
              {parsedAmount} {currency.toUpperCase()}
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <h2 className="modal-title">✅ Payment Successful!</h2>
            <div className="success-icon">✅</div>
            <p className="success-text">
              +{parsedAmount} {currency.toUpperCase()} added to your balance
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