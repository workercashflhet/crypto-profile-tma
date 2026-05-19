import { Address, TonClient, toNano, JettonMaster, WalletContractV4 } from '@ton/ton';
import axios from 'axios';

const TON_API_ENDPOINT = 'https://tonapi.io/v2';

// Адрес овнера (владельца приложения)
export const OWNER_WALLET = 'UQC5ZUl4Qobq69CgLi7tg-8y6aOwVilc5b82jJFZShtnetrw';

// Адрес jetton-контракта USDT на TON mainnet
export const USDT_MASTER = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

// Получаем баланс TON
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

// Получаем баланс USDT
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

// Создание транзакции для отправки TON
export const createTonTransfer = (amount: number): { to: string; value: string } => {
  return {
    to: OWNER_WALLET,
    value: toNano(amount).toString(),
  };
};

// Создание транзакции для отправки USDT (jetton)
export const createUsdtTransfer = async (
  senderAddress: string,
  amount: number
): Promise<{ to: string; value: string; payload?: string }> => {
  try {
    // Создаем payload для jetton-трансфера
    const usdtAmount = Math.floor(amount * 1_000_000); // 6 decimals
    
    // Формируем тело сообщения для jetton-трансфера
    const payload = createJettonTransferPayload(
      Address.parse(OWNER_WALLET),
      usdtAmount
    );
    
    return {
      to: USDT_MASTER,
      value: toNano(0.05).toString(), // Комиссия за jetton-трансфер
      payload: payload,
    };
  } catch (error) {
    console.error('Error creating USDT transfer:', error);
    throw error;
  }
};

// Создание payload для jetton-трансфера
function createJettonTransferPayload(recipient: Address, amount: number): string {
  // op::jetton_transfer = 0xf8a7ea5
  const OP_CODE = 'f8a7ea5';
  
  // Формируем тело сообщения
  const cell = [
    OP_CODE, // op code
    '0000000000000000000000000000000000000000000000000000000000000000', // query_id (0)
    amount.toString(16).padStart(64, '0'), // amount
    '0' + recipient.hash.toString('hex'), // destination
    '0000000000000000000000000000000000000000000000000000000000000000', // response_destination
    '0000000000000000', // custom_payload (null)
    '0000000000000000', // forward_ton_amount (0)
    '0000000000000000', // forward_payload (null)
  ].join('');
  
  return cell;
}