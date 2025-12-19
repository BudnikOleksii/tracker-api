import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { TransactionType } from '../../../generated/prisma/enums';
import { CacheService } from '../cache.service';
import { CacheInvalidationUtil } from './cache-invalidation.util';

describe('CacheInvalidationUtil', () => {
  let cacheInvalidationUtil: CacheInvalidationUtil;
  let mockCacheService: {
    del: jest.Mock;
    delPattern: jest.Mock;
  };

  beforeEach(() => {
    mockCacheService = {
      del: jest.fn().mockResolvedValue(undefined),
      delPattern: jest.fn().mockResolvedValue(undefined),
    };

    cacheInvalidationUtil = new CacheInvalidationUtil(
      mockCacheService as unknown as CacheService,
    );
  });

  describe('invalidateCategoryList', () => {
    it('should invalidate category list without type', async () => {
      const userId = 'user-123';

      await cacheInvalidationUtil.invalidateCategoryList(userId);

      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:all:user-123',
      );
      expect(mockCacheService.del).toHaveBeenCalledTimes(1);
    });

    it('should invalidate category list with INCOME type', async () => {
      const userId = 'user-123';

      await cacheInvalidationUtil.invalidateCategoryList(
        userId,
        TransactionType.INCOME,
      );

      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:all:user-123:INCOME',
      );
    });

    it('should invalidate category list with EXPENSE type', async () => {
      const userId = 'user-456';

      await cacheInvalidationUtil.invalidateCategoryList(
        userId,
        TransactionType.EXPENSE,
      );

      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:all:user-456:EXPENSE',
      );
    });
  });

  describe('invalidateCategoryById', () => {
    it('should invalidate category by ID', async () => {
      const categoryId = 'category-123';

      await cacheInvalidationUtil.invalidateCategoryById(categoryId);

      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:id:category-123',
      );
      expect(mockCacheService.del).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateAllUserCategories', () => {
    it('should invalidate all category lists for user', async () => {
      const userId = 'user-123';

      await cacheInvalidationUtil.invalidateAllUserCategories(userId);

      expect(mockCacheService.del).toHaveBeenCalledTimes(3);
      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:all:user-123',
      );
      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:all:user-123:INCOME',
      );
      expect(mockCacheService.del).toHaveBeenCalledWith(
        'categories:all:user-123:EXPENSE',
      );
    });

    it('should handle errors gracefully', async () => {
      mockCacheService.del.mockRejectedValueOnce(new Error('Cache error'));

      const userId = 'user-123';

      await expect(
        cacheInvalidationUtil.invalidateAllUserCategories(userId),
      ).rejects.toThrow('Cache error');
    });
  });

  describe('invalidateTransactionStats', () => {
    it('should invalidate transaction stats using pattern', async () => {
      const userId = 'user-123';

      await cacheInvalidationUtil.invalidateTransactionStats(userId);

      expect(mockCacheService.delPattern).toHaveBeenCalledWith(
        'transactions:stats:user-123:*',
      );
      expect(mockCacheService.delPattern).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateUserProfile', () => {
    it('should invalidate user profile', async () => {
      const userId = 'user-123';

      await cacheInvalidationUtil.invalidateUserProfile(userId);

      expect(mockCacheService.del).toHaveBeenCalledWith(
        'users:profile:user-123',
      );
      expect(mockCacheService.del).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateUserByEmail', () => {
    it('should invalidate user by email', async () => {
      const email = 'test@example.com';

      await cacheInvalidationUtil.invalidateUserByEmail(email);

      expect(mockCacheService.del).toHaveBeenCalledWith(
        'users:email:test@example.com',
      );
      expect(mockCacheService.del).toHaveBeenCalledTimes(1);
    });
  });
});
