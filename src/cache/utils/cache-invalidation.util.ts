import { TransactionType } from '../../../generated/prisma/enums';
import { CacheKeyUtil } from './cache-key.util';
import { CacheService } from '../cache.service';

export class CacheInvalidationUtil {
  constructor(private cacheService: CacheService) {}

  async invalidateCategoryList(
    userId: string,
    type?: TransactionType,
  ): Promise<void> {
    const key = CacheKeyUtil.categoriesAll(userId, type);
    await this.cacheService.del(key);
  }

  async invalidateCategoryById(categoryId: string): Promise<void> {
    const key = CacheKeyUtil.categoryById(categoryId);
    await this.cacheService.del(key);
  }

  async invalidateAllUserCategories(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateCategoryList(userId),
      this.invalidateCategoryList(userId, TransactionType.INCOME),
      this.invalidateCategoryList(userId, TransactionType.EXPENSE),
    ]);
  }

  async invalidateTransactionStats(userId: string): Promise<void> {
    const pattern = `transactions:stats:${userId}:*`;
    await this.cacheService.delPattern(pattern);
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    const key = CacheKeyUtil.userProfile(userId);
    await this.cacheService.del(key);
  }

  async invalidateUserByEmail(email: string): Promise<void> {
    const key = CacheKeyUtil.userByEmail(email);
    await this.cacheService.del(key);
  }
}
