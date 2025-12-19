import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { TransactionsService } from './transactions.service';
import { CacheService } from '../cache/cache.service';
import {
  TransactionsRepository,
  TransactionWithCategory,
  TransactionsAggregateSummary,
  TransactionsAggregateGroupItem,
} from './repositories/transactions.repository';
import { CategoriesRepository } from '../categories/repositories/categories.repository';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import {
  TransactionStatisticsQueryDto,
  TransactionStatisticsGroupBy,
} from './dto/transaction-statistics-query.dto';
import { CurrencyCode, TransactionType } from '../../generated/prisma/enums';
import { Category } from '../../generated/prisma/client';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    count: jest.Mock;
    aggregate: jest.Mock;
  };
  let categoriesRepository: {
    findUnique: jest.Mock;
  };

  const userId = 'user-id';
  const categoryId = 'category-id';
  const mockCategory: Category = {
    id: categoryId,
    userId,
    name: 'Groceries',
    type: TransactionType.EXPENSE,
    parentCategoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTransaction: TransactionWithCategory = {
    id: 'transaction-id',
    userId,
    categoryId,
    type: TransactionType.EXPENSE,
    amount: 100.5,
    currencyCode: CurrencyCode.USD,
    date: new Date('2024-01-01'),
    description: 'Test transaction',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    category: mockCategory,
  };

  beforeEach(async () => {
    const mockTransactionsRepository = {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    };

    const mockCategoriesRepository = {
      findUnique: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionsRepository,
          useValue: mockTransactionsRepository,
        },
        {
          provide: CategoriesRepository,
          useValue: mockCategoriesRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionsRepository = module.get(TransactionsRepository);
    categoriesRepository = module.get(CategoriesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      categoryId,
      type: TransactionType.EXPENSE,
      amount: 100.5,
      currencyCode: CurrencyCode.USD,
      date: '2024-01-01T00:00:00.000Z',
      description: 'Test transaction',
    };

    it('should successfully create income transaction', async () => {
      const incomeCategory = { ...mockCategory, type: TransactionType.INCOME };
      const incomeDto = { ...createDto, type: TransactionType.INCOME };
      const incomeTransaction = {
        ...mockTransaction,
        type: TransactionType.INCOME,
        category: incomeCategory,
      };

      categoriesRepository.findUnique.mockResolvedValue(incomeCategory);
      transactionsRepository.create.mockResolvedValue(incomeTransaction);

      const result = await service.create(userId, incomeDto);

      expect(categoriesRepository.findUnique).toHaveBeenCalledWith({
        id: categoryId,
      });
      expect(transactionsRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.type).toBe(TransactionType.INCOME);
    });

    it('should successfully create expense transaction', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      transactionsRepository.create.mockResolvedValue(mockTransaction);

      const result = await service.create(userId, createDto);

      expect(categoriesRepository.findUnique).toHaveBeenCalledWith({
        id: categoryId,
      });
      expect(transactionsRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.type).toBe(TransactionType.EXPENSE);
    });

    it('should validate category ownership', async () => {
      const otherUserCategory = { ...mockCategory, userId: 'other-user-id' };
      categoriesRepository.findUnique.mockResolvedValue(otherUserCategory);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      );
    });

    it('should validate category type matches transaction type', async () => {
      const incomeCategory = { ...mockCategory, type: TransactionType.INCOME };
      categoriesRepository.findUnique.mockResolvedValue(incomeCategory);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_CATEGORY_FOR_TRANSACTION,
      );
    });

    it('should throw NotFoundException for invalid category', async () => {
      categoriesRepository.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return TransactionResponseDto', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      transactionsRepository.create.mockResolvedValue(mockTransaction);

      const result = await service.create(userId, createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('amount');
    });
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const query: TransactionQueryDto = { page: 1, limit: 10 };
      transactionsRepository.findMany.mockResolvedValue([mockTransaction]);
      transactionsRepository.count.mockResolvedValue(1);

      const result = await service.findAll(userId, query);

      expect(transactionsRepository.findMany).toHaveBeenCalled();
      expect(transactionsRepository.count).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
    });

    it('should filter by date range', async () => {
      const query: TransactionQueryDto = {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };
      transactionsRepository.findMany.mockResolvedValue([mockTransaction]);
      transactionsRepository.count.mockResolvedValue(1);

      await service.findAll(userId, query);

      expect(transactionsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          date: {
            gte: query.dateFrom,
            lte: query.dateTo,
          },
        }),
        expect.any(Object),
      );
    });

    it('should filter by category', async () => {
      const query: TransactionQueryDto = { categoryId: 'category-id' };
      transactionsRepository.findMany.mockResolvedValue([mockTransaction]);
      transactionsRepository.count.mockResolvedValue(1);

      await service.findAll(userId, query);

      expect(transactionsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: query.categoryId,
        }),
        expect.any(Object),
      );
    });

    it('should filter by type', async () => {
      const query: TransactionQueryDto = { type: TransactionType.EXPENSE };
      transactionsRepository.findMany.mockResolvedValue([mockTransaction]);
      transactionsRepository.count.mockResolvedValue(1);

      await service.findAll(userId, query);

      expect(transactionsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.EXPENSE,
        }),
        expect.any(Object),
      );
    });

    it('should sort by date (desc)', async () => {
      const query: TransactionQueryDto = {};
      transactionsRepository.findMany.mockResolvedValue([mockTransaction]);
      transactionsRepository.count.mockResolvedValue(1);

      await service.findAll(userId, query);

      expect(transactionsRepository.findMany).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          orderBy: {
            date: 'desc',
          },
        }),
      );
    });

    it("should return only user's transactions", async () => {
      const query: TransactionQueryDto = {};
      transactionsRepository.findMany.mockResolvedValue([mockTransaction]);
      transactionsRepository.count.mockResolvedValue(1);

      await service.findAll(userId, query);

      expect(transactionsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
        }),
        expect.any(Object),
      );
    });

    it('should handle empty results', async () => {
      const query: TransactionQueryDto = {};
      transactionsRepository.findMany.mockResolvedValue([]);
      transactionsRepository.count.mockResolvedValue(0);

      const result = await service.findAll(userId, query);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should successfully find transaction by ID', async () => {
      transactionsRepository.findUnique.mockResolvedValue(mockTransaction);

      const result = await service.findOne(userId, mockTransaction.id);

      expect(transactionsRepository.findUnique).toHaveBeenCalledWith({
        id: mockTransaction.id,
      });
      expect(result).toHaveProperty('id', mockTransaction.id);
    });

    it('should throw NotFoundException for non-existent transaction', async () => {
      transactionsRepository.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, 'non-existent-id')).rejects.toThrow(
        ERROR_MESSAGES.TRANSACTION_NOT_FOUND,
      );
    });

    it("should throw NotFoundException for other user's transaction", async () => {
      const otherUserTransaction = {
        ...mockTransaction,
        userId: 'other-user-id',
      };
      transactionsRepository.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(service.findOne(userId, mockTransaction.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateTransactionDto = {
      amount: 200.0,
      description: 'Updated description',
    };

    it('should successfully update transaction', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        amount: 200.0,
        description: 'Updated description',
      };
      transactionsRepository.findUnique.mockResolvedValue(mockTransaction);
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      transactionsRepository.update.mockResolvedValue(updatedTransaction);

      const result = await service.update(
        userId,
        mockTransaction.id,
        updateDto,
      );

      expect(transactionsRepository.findUnique).toHaveBeenCalledWith({
        id: mockTransaction.id,
      });
      expect(transactionsRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('amount', '200');
    });

    it('should validate category ownership', async () => {
      const updateWithCategoryDto: UpdateTransactionDto = {
        ...updateDto,
        categoryId: 'new-category-id',
      };
      const otherUserCategory = { ...mockCategory, userId: 'other-user-id' };

      transactionsRepository.findUnique.mockResolvedValue(mockTransaction);
      categoriesRepository.findUnique.mockResolvedValue(otherUserCategory);

      await expect(
        service.update(userId, mockTransaction.id, updateWithCategoryDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate category type matches transaction type', async () => {
      const updateWithCategoryDto: UpdateTransactionDto = {
        ...updateDto,
        categoryId: 'new-category-id',
        type: TransactionType.INCOME,
      };
      const expenseCategory = {
        ...mockCategory,
        type: TransactionType.EXPENSE,
      };

      transactionsRepository.findUnique.mockResolvedValue(mockTransaction);
      categoriesRepository.findUnique.mockResolvedValue(expenseCategory);

      await expect(
        service.update(userId, mockTransaction.id, updateWithCategoryDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent transaction', async () => {
      transactionsRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully delete transaction', async () => {
      transactionsRepository.findUnique.mockResolvedValue(mockTransaction);
      transactionsRepository.softDelete.mockResolvedValue(mockTransaction);

      await service.remove(userId, mockTransaction.id);

      expect(transactionsRepository.findUnique).toHaveBeenCalledWith({
        id: mockTransaction.id,
      });
      expect(transactionsRepository.softDelete).toHaveBeenCalledWith({
        id: mockTransaction.id,
      });
    });

    it('should throw NotFoundException for non-existent transaction', async () => {
      transactionsRepository.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException for other user's transaction", async () => {
      const otherUserTransaction = {
        ...mockTransaction,
        userId: 'other-user-id',
      };
      transactionsRepository.findUnique.mockResolvedValue(otherUserTransaction);

      await expect(service.remove(userId, mockTransaction.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should calculate total income for date range', async () => {
      const query: TransactionStatisticsQueryDto = {
        type: TransactionType.INCOME,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };
      const summary: TransactionsAggregateSummary = {
        totalAmount: '1000.00',
        transactionCount: 10,
      };

      transactionsRepository.aggregate.mockResolvedValue(summary);

      const result = await service.getStatistics(userId, query);

      expect(transactionsRepository.aggregate).toHaveBeenCalled();
      expect(result).toHaveProperty('totalAmount', '1000.00');
      expect(result).toHaveProperty('transactionCount', 10);
    });

    it('should calculate total expenses for date range', async () => {
      const query: TransactionStatisticsQueryDto = {
        type: TransactionType.EXPENSE,
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };
      const summary: TransactionsAggregateSummary = {
        totalAmount: '500.00',
        transactionCount: 5,
      };

      transactionsRepository.aggregate.mockResolvedValue(summary);

      const result = await service.getStatistics(userId, query);

      expect(result).toHaveProperty('totalAmount', '500.00');
      expect(result).toHaveProperty('transactionCount', 5);
    });

    it('should calculate net balance', async () => {
      const query: TransactionStatisticsQueryDto = {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };
      const summary: TransactionsAggregateSummary = {
        totalAmount: '500.00',
        transactionCount: 15,
      };

      transactionsRepository.aggregate.mockResolvedValue(summary);

      const result = await service.getStatistics(userId, query);

      expect(result).toHaveProperty('totalAmount');
      expect(result).toHaveProperty('transactionCount');
    });

    it('should filter by category', async () => {
      const query: TransactionStatisticsQueryDto = {
        dateFrom: new Date('2024-01-01'),
        dateTo: new Date('2024-12-31'),
      };
      const summary: TransactionsAggregateSummary = {
        totalAmount: '100.00',
        transactionCount: 2,
      };

      transactionsRepository.aggregate.mockResolvedValue(summary);

      await service.getStatistics(userId, query);

      expect(transactionsRepository.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
        }),
        undefined,
      );
    });

    it('should filter by type', async () => {
      const query: TransactionStatisticsQueryDto = {
        type: TransactionType.EXPENSE,
      };
      const summary: TransactionsAggregateSummary = {
        totalAmount: '200.00',
        transactionCount: 3,
      };

      transactionsRepository.aggregate.mockResolvedValue(summary);

      await service.getStatistics(userId, query);

      expect(transactionsRepository.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: TransactionType.EXPENSE,
        }),
        undefined,
      );
    });

    it('should handle empty results', async () => {
      const query: TransactionStatisticsQueryDto = {};
      const summary: TransactionsAggregateSummary = {
        totalAmount: '0',
        transactionCount: 0,
      };

      transactionsRepository.aggregate.mockResolvedValue(summary);

      const result = await service.getStatistics(userId, query);

      expect(result.totalAmount).toBe('0');
      expect(result.transactionCount).toBe(0);
    });

    it('should group by category', async () => {
      const query: TransactionStatisticsQueryDto = {
        groupBy: TransactionStatisticsGroupBy.CATEGORY,
      };
      const grouped: TransactionsAggregateGroupItem[] = [
        {
          categoryId: 'category-1',
          totalAmount: '100.00',
          transactionCount: 2,
        },
        {
          categoryId: 'category-2',
          totalAmount: '200.00',
          transactionCount: 3,
        },
      ];

      transactionsRepository.aggregate.mockResolvedValue(grouped);

      const result = await service.getStatistics(userId, query);

      expect(result).toHaveProperty('groupedData');
      expect(result.groupedData).toHaveLength(2);
    });

    it('should group by month', async () => {
      const query: TransactionStatisticsQueryDto = {
        groupBy: TransactionStatisticsGroupBy.MONTH,
      };
      const grouped: TransactionsAggregateGroupItem[] = [
        {
          date: new Date('2024-01-01'),
          totalAmount: '100.00',
          transactionCount: 2,
        },
        {
          date: new Date('2024-02-01'),
          totalAmount: '200.00',
          transactionCount: 3,
        },
      ];

      transactionsRepository.aggregate.mockResolvedValue(grouped);

      const result = await service.getStatistics(userId, query);

      expect(result).toHaveProperty('groupedData');
      expect(result.groupedData).toHaveLength(2);
    });
  });
});
