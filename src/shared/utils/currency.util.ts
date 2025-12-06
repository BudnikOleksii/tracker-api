import { CurrencyCode } from '../../../generated/prisma/enums';

export const isValidCurrencyCode = (code: string): code is CurrencyCode => {
  return Object.values(CurrencyCode).includes(code as CurrencyCode);
};

export const validateCurrencyCode = (code: string): CurrencyCode => {
  if (!isValidCurrencyCode(code)) {
    throw new Error(`Invalid currency code: ${code}`);
  }

  return code;
};
