import { Address } from '@ton/core';

/**
 * Конвертирует raw адрес в user-friendly формат
 * @param rawAddress - адрес в формате 0:xxx... или UQ.../EQ...
 * @returns user-friendly адрес (bounceable)
 */
export const formatAddress = (rawAddress: string): string => {
  try {
    // Парсим адрес
    const address = Address.parse(rawAddress);
    
    // Конвертируем в user-friendly формат (bounceable)
    return address.toString({
      bounceable: true,
      testOnly: false,
    });
  } catch (error) {
    console.error('Error formatting address:', error);
    return rawAddress;
  }
};

/**
 * Конвертирует адрес в разные форматы
 */
export const getAddressFormats = (rawAddress: string) => {
  try {
    const address = Address.parse(rawAddress);
    
    return {
      // Bounceable (для кошельков)
      bounceable: address.toString({ bounceable: true, testOnly: false }),
      // Non-bounceable
      nonBounceable: address.toString({ bounceable: false, testOnly: false }),
      // Raw формат
      raw: address.toRawString(),
      // Сокращенный bounceable
      short: `${address.toString({ bounceable: true, testOnly: false }).slice(0, 8)}...${address.toString({ bounceable: true, testOnly: false }).slice(-8)}`,
    };
  } catch {
    return null;
  }
};