import { describe, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';

import { CurrencyCode } from '../../../generated/prisma/enums';
import { isValidCurrencyCode, validateCurrencyCode } from './currency.util';

describe('CurrencyUtil', () => {
  describe('isValidCurrencyCode', () => {
    it('should return true for valid currency codes', () => {
      expect(isValidCurrencyCode(CurrencyCode.USD)).toBe(true);
      expect(isValidCurrencyCode(CurrencyCode.EUR)).toBe(true);
      expect(isValidCurrencyCode(CurrencyCode.GBP)).toBe(true);
      expect(isValidCurrencyCode(CurrencyCode.JPY)).toBe(true);
    });

    it('should return false for invalid currency codes', () => {
      expect(isValidCurrencyCode('INVALID')).toBe(false);
      expect(isValidCurrencyCode('')).toBe(false);
      expect(isValidCurrencyCode('ABC123')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidCurrencyCode(null as unknown as string)).toBe(false);
      expect(isValidCurrencyCode(undefined as unknown as string)).toBe(false);
    });
  });

  describe('validateCurrencyCode', () => {
    it('should return the currency code when valid', () => {
      expect(validateCurrencyCode(CurrencyCode.USD)).toBe(CurrencyCode.USD);
      expect(validateCurrencyCode(CurrencyCode.EUR)).toBe(CurrencyCode.EUR);
      expect(validateCurrencyCode(CurrencyCode.GBP)).toBe(CurrencyCode.GBP);
    });

    it('should throw BadRequestException for invalid currency codes', () => {
      expect(() => validateCurrencyCode('INVALID')).toThrow(
        BadRequestException,
      );
      expect(() => validateCurrencyCode('INVALID')).toThrow(
        'Invalid currency code: INVALID',
      );
    });

    it('should throw BadRequestException for empty string', () => {
      expect(() => validateCurrencyCode('')).toThrow(BadRequestException);
      expect(() => validateCurrencyCode('')).toThrow('Invalid currency code: ');
    });
  });
});
