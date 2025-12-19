import { createHash } from 'crypto';

import { TransactionType } from '../../../generated/prisma/enums';
import { TransactionStatisticsQueryDto } from '../../transactions/dto/transaction-statistics-query.dto';

export class CacheKeyUtil {
  static categoriesAll(userId: string, type?: TransactionType): string {
    const typeSuffix = type ? `:${type}` : '';

    return `categories:all:${userId}${typeSuffix}`;
  }

  static categoryById(categoryId: string): string {
    return `categories:id:${categoryId}`;
  }

  static transactionStats(
    userId: string,
    query: TransactionStatisticsQueryDto,
  ): string {
    const queryHash = this.hashQueryParams(query);

    return `transactions:stats:${userId}:${queryHash}`;
  }

  static userProfile(userId: string): string {
    return `users:profile:${userId}`;
  }

  static userByEmail(email: string): string {
    return `users:email:${email}`;
  }

  private static hashQueryParams(query: TransactionStatisticsQueryDto): string {
    const normalizedQuery = {
      type: query.type || null,
      currencyCode: query.currencyCode || null,
      dateFrom: query.dateFrom ? query.dateFrom.toISOString() : null,
      dateTo: query.dateTo ? query.dateTo.toISOString() : null,
      groupBy: query.groupBy || null,
    };

    const queryString = JSON.stringify(
      normalizedQuery,
      Object.keys(normalizedQuery).sort(),
    );

    return createHash('md5').update(queryString).digest('hex');
  }
}
