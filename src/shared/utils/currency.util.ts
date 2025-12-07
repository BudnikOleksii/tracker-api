import { BadRequestException } from '@nestjs/common';

import { CurrencyCode } from '../../../generated/prisma/enums';

export const isValidCurrencyCode = (code: string): code is CurrencyCode => {
  return Object.values(CurrencyCode).includes(code as CurrencyCode);
};

export const validateCurrencyCode = (code: string): CurrencyCode => {
  if (!isValidCurrencyCode(code)) {
    throw new BadRequestException(`Invalid currency code: ${code}`);
  }

  return code;
};
