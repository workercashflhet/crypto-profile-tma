import { Address } from '@ton/core';

/**
 * Конвертирует адрес в non-bounceable формат
 */
export const formatAddress = (rawAddress: string): string => {
  try {
    const address = Address.parse(rawAddress);
    
    // Всегда возвращаем non-bounceable формат (UQ...)
    return address.toString({ bounceable: false, testOnly: false });
  } catch (error) {
    console.error('Error formatting address:', error);
    return rawAddress;
  }
};

/**
 * Получает сокращенный адрес
 */
export const getShortAddress = (rawAddress: string): string => {
  const friendlyAddress = formatAddress(rawAddress);
  return `${friendlyAddress.slice(0, 8)}...${friendlyAddress.slice(-8)}`;
};