import { describe, it, expect } from '@jest/globals';

import { formatDate, isValidDate, parseDate } from './date.util';

describe('DateUtil', () => {
  describe('formatDate', () => {
    it('should format date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should format different dates correctly', () => {
      const date1 = new Date('2023-12-25T00:00:00Z');
      expect(formatDate(date1)).toBe('2023-12-25T00:00:00.000Z');

      const date2 = new Date('2025-06-30T23:59:59Z');
      expect(formatDate(date2)).toBe('2025-06-30T23:59:59.000Z');
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date objects', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-15'))).toBe(true);
      expect(isValidDate(new Date(1640995200000))).toBe(true);
    });

    it('should return false for invalid Date objects', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate(new Date(NaN))).toBe(false);
    });

    it('should return false for non-Date values', () => {
      expect(isValidDate('2024-01-15')).toBe(false);
      expect(isValidDate(1640995200000)).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate({})).toBe(false);
      expect(isValidDate([])).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should parse ISO date strings', () => {
      const dateString = '2023-12-25T00:00:00.000Z';
      const result = parseDate(dateString);
      expect(result).toBeInstanceOf(Date);
      expect(isValidDate(result)).toBe(true);
    });

    it('should throw Error for invalid date strings', () => {
      expect(() => parseDate('invalid-date')).toThrow(Error);
      expect(() => parseDate('invalid-date')).toThrow('Invalid date string');
    });

    it('should throw Error for empty string', () => {
      expect(() => parseDate('')).toThrow(Error);
      expect(() => parseDate('')).toThrow('Invalid date string');
    });
  });
});
