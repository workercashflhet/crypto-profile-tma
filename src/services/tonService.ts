import { Address, toNano } from '@ton/ton';
import { beginCell } from '@ton/core';
import axios from 'axios';

const TON_API_ENDPOINT = 'https://tonapi.io/v2';
export const OWNER_WALLET = 'UQC5ZUl4Qobq69CgLi7tg-8y6aOwVilc5b82jJFZShtnetrw';
export const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

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

export const getUsdtBalance = async (address: string): Promise<number> => {
  try {
    const response = await axios.get(
      `${TON_API_ENDPOINT}/accounts/${address}/jettons/${USDT_MASTER}`
    );
    const balance = response.data.balance || 0;
    return balance / 1_000_000;
  } catch (error) {
    console.error('Error fetching USDT balance:', error);
    return 0;
  }
};

export const createTonTransfer = (amount: number): { to: string; value: string } => {
  return {
    to: OWNER_WALLET,
    value: toNano(amount).toString(),
  };
};

export const createUsdtTransfer = (amount: number): { to: string; value: string; payload: string } => {
  const usdtAmount = BigInt(Math.floor(amount * 1_000_000));
  
  const payload = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(0, 64)
    .storeCoins(usdtAmount)
    .storeAddress(Address.parse(OWNER_WALLET))
    .storeAddress(null)
    .storeBit(0)
    .storeCoins(0)
    .storeBit(0)
    .endCell()
    .toBoc()
    .toString('base64');

  return {
    to: USDT_MASTER,
    value: toNano(0.05).toString(),
    payload: payload,
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