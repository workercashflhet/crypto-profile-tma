import { Address, toNano } from '@ton/ton';
import { beginCell } from '@ton/core';
import axios from 'axios';

const TON_API_ENDPOINT = 'https://tonapi.io/v2';
export const OWNER_WALLET = 'UQC5ZUl4Qobq69CgLi7tg-8y6aOwVilc5b82jJFZShtnetrw';

export const getTonBalance = async (address: string): Promise<number> => {
  try {
    const response = await axios.get(`${TON_API_ENDPOINT}/accounts/${address}`);
    const balance = response.data.balance || 0;
    return balance / 1_000_000_000;
  } catch (error) {
    console.error('Error fetching TON balance:', error);
    return 0;
  }
};

export const createTonTransfer = (amount: number): { to: string; value: string } => {
  return {
    to: OWNER_WALLET,
    value: toNano(amount).toString(),
  };
};

export const createStarsInvoice = (amount: number): { title: string; description: string; payload: string; currency: string; amount: number } => {
  return {
    title: 'Deposit Stars',
    description: `Deposit ${amount} Telegram Stars to game balance`,
    payload: `stars_deposit_${amount}_${Date.now()}`,
    currency: 'XTR',
    amount: amount,
  };
};

export const isValidTonAddress = (address: string): boolean => {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
};