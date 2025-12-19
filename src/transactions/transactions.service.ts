import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { CurrencyCode, TransactionType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';
import { CategoriesRepository } from '../categories/repositories/categories.repository';
import {
  TransactionWithCategory,
  TransactionsAggregateGroupItem,
  TransactionsAggregateSummary,
  TransactionsRepository,
} from './repositories/transactions.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import {
  TransactionStatisticsGroupBy,
  TransactionStatisticsQueryDto,
} from './dto/transaction-statistics-query.dto';
import {
  TransactionStatisticsDateRangeDto,
  TransactionStatisticsGroupDataDto,
  TransactionStatisticsResponseDto,
} from './dto/transaction-statistics-response.dto';
import { CacheService } from '../cache/cache.service';
import { CacheKeyUtil } from '../cache/utils/cache-key.util';
import { CacheInvalidationUtil } from '../cache/utils/cache-invalidation.util';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const STATISTICS_CACHE_TTL = 300;

@Injectable()
export class TransactionsService {
  private cacheInvalidation: CacheInvalidationUtil;

  constructor(
    private transactionsRepository: TransactionsRepository,
    private categoriesRepository: CategoriesRepository,
    private cacheService: CacheService,
  ) {
    this.cacheInvalidation = new CacheInvalidationUtil(cacheService);
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    await this.validateCategoryOwnership(userId, dto.categoryId, dto.type);

    const transaction = await this.transactionsRepository.create({
      userId,
      categoryId: dto.categoryId,
      type: dto.type,
      amount: dto.amount,
      currencyCode: dto.currencyCode,
      date: dto.date,
      description: dto.description,
    });

    await this.cacheInvalidation.invalidateTransactionStats(userId);

    return this.mapTransactionToDto(transaction);
  }

  async findAll(
    userId: string,
    query: TransactionQueryDto,
  ): Promise<{
    data: TransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.validateDateRange(query.dateFrom, query.dateTo);

    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const where: {
      userId: string;
      type?: TransactionType;
      categoryId?: string;
      currencyCode?: CurrencyCode;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      userId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.currencyCode) {
      where.currencyCode = query.currencyCode;
    }

    if (query.dateFrom || query.dateTo) {
      where.date = {};

      if (query.dateFrom) {
        where.date.gte = query.dateFrom;
      }

      if (query.dateTo) {
        where.date.lte = query.dateTo;
      }
    }

    const [transactions, total] = await Promise.all([
      this.transactionsRepository.findMany(where, {
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          date: 'desc',
        },
      }),
      this.transactionsRepository.count(where),
    ]);

    return {
      data: transactions.map((transaction) =>
        this.mapTransactionToDto(transaction),
      ),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, id: string): Promise<TransactionResponseDto> {
    const transaction = await this.validateTransactionOwnership(userId, id);

    return this.mapTransactionToDto(transaction);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    if (
      dto.categoryId === undefined &&
      dto.type === undefined &&
      dto.amount === undefined &&
      dto.currencyCode === undefined &&
      dto.date === undefined &&
      dto.description === undefined
    ) {
      throw new BadRequestException(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE);
    }

    const currentTransaction = await this.validateTransactionOwnership(
      userId,
      id,
    );

    const nextType = dto.type ?? currentTransaction.type;
    const nextCategoryId = dto.categoryId ?? currentTransaction.categoryId;

    await this.validateCategoryOwnership(userId, nextCategoryId, nextType);

    const updatedTransaction = await this.transactionsRepository.update(
      { id },
      {
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount,
        currencyCode: dto.currencyCode,
        date: dto.date,
        description: dto.description,
      },
    );

    await this.cacheInvalidation.invalidateTransactionStats(userId);

    return this.mapTransactionToDto(updatedTransaction);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.validateTransactionOwnership(userId, id);

    await this.transactionsRepository.softDelete({ id });

    await this.cacheInvalidation.invalidateTransactionStats(userId);
  }

  async getStatistics(
    userId: string,
    query: TransactionStatisticsQueryDto,
  ): Promise<TransactionStatisticsResponseDto> {
    this.validateDateRange(query.dateFrom, query.dateTo);

    const cacheKey = CacheKeyUtil.transactionStats(userId, query);
    const cached =
      await this.cacheService.get<TransactionStatisticsResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const where: {
      userId: string;
      type?: TransactionType;
      currencyCode?: CurrencyCode;
      date?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      userId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.currencyCode) {
      where.currencyCode = query.currencyCode;
    }

    if (query.dateFrom || query.dateTo) {
      where.date = {};

      if (query.dateFrom) {
        where.date.gte = query.dateFrom;
      }

      if (query.dateTo) {
        where.date.lte = query.dateTo;
      }
    }

    const aggregateResult = await this.transactionsRepository.aggregate(
      where,
      query.groupBy,
    );

    if (!query.groupBy) {
      const summary = aggregateResult as TransactionsAggregateSummary;

      const result = this.buildStatisticsResponse(
        summary.totalAmount,
        summary.transactionCount,
        [],
        query.dateFrom ?? null,
        query.dateTo ?? null,
      );

      await this.cacheService.set(cacheKey, result, STATISTICS_CACHE_TTL);

      return result;
    }

    const grouped = aggregateResult as TransactionsAggregateGroupItem[];

    const groupedData = grouped.map((item) => {
      const key = this.buildGroupKey(item, query.groupBy);

      const groupData = new TransactionStatisticsGroupDataDto();
      groupData.key = key;
      groupData.totalAmount = item.totalAmount;
      groupData.transactionCount = item.transactionCount;

      return groupData;
    });

    const totalAmount = groupedData.reduce<string>((accumulator, item) => {
      const nextValue = Number(accumulator) + Number(item.totalAmount);

      return nextValue.toFixed(4);
    }, '0');

    const transactionCount = groupedData.reduce<number>(
      (accumulator, item) => accumulator + item.transactionCount,
      0,
    );

    const result = this.buildStatisticsResponse(
      totalAmount,
      transactionCount,
      groupedData,
      query.dateFrom ?? null,
      query.dateTo ?? null,
    );

    await this.cacheService.set(cacheKey, result, STATISTICS_CACHE_TTL);

    return result;
  }

  private async validateTransactionOwnership(
    userId: string,
    transactionId: string,
  ): Promise<TransactionWithCategory> {
    const transaction = await this.transactionsRepository.findUnique({
      id: transactionId,
    });

    if (
      !transaction ||
      transaction.deletedAt ||
      transaction.userId !== userId
    ) {
      throw new NotFoundException(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }

    return transaction;
  }

  private async validateCategoryOwnership(
    userId: string,
    categoryId: string,
    type: TransactionType,
  ): Promise<void> {
    const category = await this.categoriesRepository.findUnique({
      id: categoryId,
    });

    if (!category || category.deletedAt || category.userId !== userId) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category.type !== type) {
      throw new BadRequestException(
        ERROR_MESSAGES.INVALID_CATEGORY_FOR_TRANSACTION,
      );
    }
  }

  private validateDateRange(dateFrom?: Date, dateTo?: Date): void {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_DATE_RANGE);
    }

    const now = new Date();

    if (dateFrom && dateFrom > now) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_DATE_RANGE);
    }

    if (dateTo && dateTo > now) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_DATE_RANGE);
    }
  }

  private buildGroupKey(
    item: TransactionsAggregateGroupItem,
    groupBy?: TransactionStatisticsGroupBy,
  ): string {
    if (groupBy === TransactionStatisticsGroupBy.CATEGORY && item.categoryId) {
      return item.categoryId;
    }

    if (
      groupBy === TransactionStatisticsGroupBy.CURRENCY &&
      item.currencyCode
    ) {
      return item.currencyCode;
    }

    if (groupBy === TransactionStatisticsGroupBy.MONTH && item.date) {
      const year = item.date.getUTCFullYear();
      const month = (item.date.getUTCMonth() + 1).toString().padStart(2, '0');

      return `${year}-${month}`;
    }

    if (groupBy === TransactionStatisticsGroupBy.YEAR && item.date) {
      return item.date.getUTCFullYear().toString();
    }

    return 'unknown';
  }

  private buildStatisticsResponse(
    totalAmount: string,
    transactionCount: number,
    groupedData: TransactionStatisticsGroupDataDto[],
    dateFrom: Date | null,
    dateTo: Date | null,
  ): TransactionStatisticsResponseDto {
    const dateRange = new TransactionStatisticsDateRangeDto();
    dateRange.from = dateFrom;
    dateRange.to = dateTo;

    const response = new TransactionStatisticsResponseDto();
    response.totalAmount = totalAmount;
    response.transactionCount = transactionCount;
    response.groupedData = groupedData;
    response.dateRange = dateRange;

    return plainToInstance(TransactionStatisticsResponseDto, response, {
      excludeExtraneousValues: true,
    });
  }

  private mapTransactionToDto(
    transaction: TransactionWithCategory,
  ): TransactionResponseDto {
    const mapped = {
      ...transaction,
      amount: transaction.amount.toString(),
    };

    return plainToInstance(TransactionResponseDto, mapped, {
      excludeExtraneousValues: true,
    });
  }
}
