import { describe, it, expect } from '@jest/globals';

import { TransactionType, CurrencyCode } from '../../../generated/prisma/enums';
import {
  TransactionStatisticsQueryDto,
  TransactionStatisticsGroupBy,
} from '../../transactions/dto/transaction-statistics-query.dto';
import { CacheKeyUtil } from './cache-key.util';

describe('CacheKeyUtil', () => {
  describe('categoriesAll', () => {
    it('should generate key for all categories without type', () => {
      const userId = 'user-123';
      const key = CacheKeyUtil.categoriesAll(userId);

      expect(key).toBe('categories:all:user-123');
    });

    it('should generate key for categories with INCOME type', () => {
      const userId = 'user-123';
      const key = CacheKeyUtil.categoriesAll(userId, TransactionType.INCOME);

      expect(key).toBe('categories:all:user-123:INCOME');
    });

    it('should generate key for categories with EXPENSE type', () => {
      const userId = 'user-456';
      const key = CacheKeyUtil.categoriesAll(userId, TransactionType.EXPENSE);

      expect(key).toBe('categories:all:user-456:EXPENSE');
    });
  });

  describe('categoryById', () => {
    it('should generate key for category by ID', () => {
      const categoryId = 'category-123';
      const key = CacheKeyUtil.categoryById(categoryId);

      expect(key).toBe('categories:id:category-123');
    });

    it('should generate different keys for different category IDs', () => {
      const key1 = CacheKeyUtil.categoryById('category-1');
      const key2 = CacheKeyUtil.categoryById('category-2');

      expect(key1).not.toBe(key2);
      expect(key1).toBe('categories:id:category-1');
      expect(key2).toBe('categories:id:category-2');
    });
  });

  describe('transactionStats', () => {
    it('should generate consistent key for same query parameters', () => {
      const userId = 'user-123';
      const query: TransactionStatisticsQueryDto = {
        type: TransactionType.EXPENSE,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };

      const key1 = CacheKeyUtil.transactionStats(userId, query);
      const key2 = CacheKeyUtil.transactionStats(userId, query);

      expect(key1).toBe(key2);
      expect(key1).toContain('transactions:stats:user-123:');
    });

    it('should generate different keys for different query parameters', () => {
      const userId = 'user-123';
      const query1: TransactionStatisticsQueryDto = {
        type: TransactionType.INCOME,
      };
      const query2: TransactionStatisticsQueryDto = {
        type: TransactionType.EXPENSE,
      };

      const key1 = CacheKeyUtil.transactionStats(userId, query1);
      const key2 = CacheKeyUtil.transactionStats(userId, query2);

      expect(key1).not.toBe(key2);
    });

    it('should generate key with hash for complex query', () => {
      const userId = 'user-123';
      const query: TransactionStatisticsQueryDto = {
        type: TransactionType.EXPENSE,
        currencyCode: 'USD' as CurrencyCode,
        dateFrom: new Date('2024-01-01T00:00:00.000Z'),
        dateTo: new Date('2024-12-31T23:59:59.999Z'),
        groupBy: TransactionStatisticsGroupBy.CATEGORY,
      };

      const key = CacheKeyUtil.transactionStats(userId, query);

      expect(key).toMatch(/^transactions:stats:user-123:[a-f0-9]{32}$/);
    });

    it('should handle empty query object', () => {
      const userId = 'user-123';
      const query: TransactionStatisticsQueryDto = {};

      const key = CacheKeyUtil.transactionStats(userId, query);

      expect(key).toContain('transactions:stats:user-123:');
    });

    it('should generate same key for queries with same normalized values', () => {
      const userId = 'user-123';
      const query1: TransactionStatisticsQueryDto = {
        dateFrom: new Date('2024-01-01T00:00:00.000Z'),
      };
      const query2: TransactionStatisticsQueryDto = {
        dateFrom: new Date('2024-01-01T00:00:00.000Z'),
      };

      const key1 = CacheKeyUtil.transactionStats(userId, query1);
      const key2 = CacheKeyUtil.transactionStats(userId, query2);

      expect(key1).toBe(key2);
    });
  });

  describe('userProfile', () => {
    it('should generate key for user profile', () => {
      const userId = 'user-123';
      const key = CacheKeyUtil.userProfile(userId);

      expect(key).toBe('users:profile:user-123');
    });
  });

  describe('userByEmail', () => {
    it('should generate key for user by email', () => {
      const email = 'test@example.com';
      const key = CacheKeyUtil.userByEmail(email);

      expect(key).toBe('users:email:test@example.com');
    });

    it('should generate different keys for different emails', () => {
      const key1 = CacheKeyUtil.userByEmail('user1@example.com');
      const key2 = CacheKeyUtil.userByEmail('user2@example.com');

      expect(key1).not.toBe(key2);
    });
  });
});
