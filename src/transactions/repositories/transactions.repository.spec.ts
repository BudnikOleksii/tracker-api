import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { TransactionsRepository } from './transactions.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatisticsGroupBy } from '../dto/transaction-statistics-query.dto';
import { TransactionType, CurrencyCode } from '../../../generated/prisma/enums';
import { Transaction, Category } from '../../../generated/prisma/client';

describe('TransactionsRepository', () => {
  let repository: TransactionsRepository;
  let prismaService: {
    transaction: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  const mockCategory: Category = {
    id: 'category-id',
    userId: 'user-id',
    name: 'Test Category',
    type: TransactionType.EXPENSE,
    parentCategoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTransaction: Transaction = {
    id: 'transaction-id',
    userId: 'user-id',
    categoryId: 'category-id',
    type: TransactionType.EXPENSE,
    amount: '100.00',
    currencyCode: CurrencyCode.USD,
    date: new Date(),
    description: 'Test transaction',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTransactionWithCategory = {
    ...mockTransaction,
    category: mockCategory,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      transaction: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<TransactionsRepository>(TransactionsRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUnique', () => {
    it('should find transaction by ID', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(
        mockTransactionWithCategory,
      );

      const result = await repository.findUnique({ id: mockTransaction.id });

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockTransactionWithCategory);
    });

    it('should include category', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(
        mockTransactionWithCategory,
      );

      const result = await repository.findUnique({ id: mockTransaction.id });

      expect(result?.category).toEqual(mockCategory);
    });

    it('should return null for non-existent transaction', async () => {
      prismaService.transaction.findUnique.mockResolvedValue(null);

      const result = await repository.findUnique({ id: 'non-existent-id' });

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          category: true,
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return paginated transactions', async () => {
      const transactions = [mockTransactionWithCategory];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = { userId: mockTransaction.userId };
      const options = { skip: 0, take: 10 };
      const result = await repository.findMany(where, options);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        skip: options.skip,
        take: options.take,
        orderBy: undefined,
      });
      expect(result).toEqual(transactions);
    });

    it('should apply date range filters', async () => {
      const transactions = [mockTransactionWithCategory];
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-12-31');

      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = {
        userId: mockTransaction.userId,
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      };
      const result = await repository.findMany(where);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(transactions);
    });

    it('should apply category filters', async () => {
      const transactions = [mockTransactionWithCategory];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = {
        userId: mockTransaction.userId,
        categoryId: mockCategory.id,
      };
      const result = await repository.findMany(where);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(transactions);
    });

    it('should apply type filters', async () => {
      const transactions = [mockTransactionWithCategory];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = {
        userId: mockTransaction.userId,
        type: TransactionType.INCOME,
      };
      const result = await repository.findMany(where);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(transactions);
    });

    it('should apply sorting', async () => {
      const transactions = [mockTransactionWithCategory];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = { userId: mockTransaction.userId };
      const options = {
        orderBy: { date: 'desc' as const },
      };
      const result = await repository.findMany(where, options);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        skip: undefined,
        take: undefined,
        orderBy: options.orderBy,
      });
      expect(result).toEqual(transactions);
    });

    it('should include category relation', async () => {
      const transactions = [mockTransactionWithCategory];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = { userId: mockTransaction.userId };
      const result = await repository.findMany(where);

      expect(result[0].category).toEqual(mockCategory);
    });

    it('should exclude soft-deleted transactions', async () => {
      const transactions: (typeof mockTransactionWithCategory)[] = [];
      prismaService.transaction.findMany.mockResolvedValue(transactions);

      const where = { userId: mockTransaction.userId };
      const result = await repository.findMany(where);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        include: {
          category: true,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(transactions);
    });
  });

  describe('create', () => {
    it('should create transaction with all fields', async () => {
      const createData = {
        userId: mockTransaction.userId,
        categoryId: mockTransaction.categoryId,
        type: mockTransaction.type,
        amount: mockTransaction.amount,
        currencyCode: mockTransaction.currencyCode,
        date: mockTransaction.date,
        description: mockTransaction.description,
      };

      prismaService.transaction.create.mockResolvedValue(
        mockTransactionWithCategory,
      );

      const result = await repository.create(createData);

      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          categoryId: createData.categoryId,
          type: createData.type,
          amount: createData.amount,
          currencyCode: createData.currencyCode,
          date: createData.date,
          description: createData.description,
        },
        include: {
          category: true,
        },
      });
      expect(result).toEqual(mockTransactionWithCategory);
    });

    it('should return transaction with category', async () => {
      const createData = {
        userId: mockTransaction.userId,
        categoryId: mockTransaction.categoryId,
        type: mockTransaction.type,
        amount: mockTransaction.amount,
        currencyCode: mockTransaction.currencyCode,
        date: mockTransaction.date,
      };

      prismaService.transaction.create.mockResolvedValue(
        mockTransactionWithCategory,
      );

      const result = await repository.create(createData);

      expect(result.category).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update transaction fields', async () => {
      const updateData = {
        amount: '200.00',
        description: 'Updated description',
      };

      const updatedTransaction = {
        ...mockTransactionWithCategory,
        ...updateData,
      };

      prismaService.transaction.update.mockResolvedValue(updatedTransaction);

      const result = await repository.update(
        { id: mockTransaction.id },
        updateData,
      );

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: updateData,
        include: {
          category: true,
        },
      });
      expect(result).toEqual(updatedTransaction);
    });

    it('should return updated transaction with category', async () => {
      const updateData = {
        amount: '150.00',
      };

      const updatedTransaction = {
        ...mockTransactionWithCategory,
        ...updateData,
      };

      prismaService.transaction.update.mockResolvedValue(updatedTransaction);

      const result = await repository.update(
        { id: mockTransaction.id },
        updateData,
      );

      expect(result.category).toEqual(mockCategory);
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt timestamp', async () => {
      const deletedTransaction = {
        ...mockTransaction,
        deletedAt: new Date(),
      };

      prismaService.transaction.update.mockResolvedValue(deletedTransaction);

      const result = await repository.softDelete({ id: mockTransaction.id });

      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
        data: {
          deletedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(deletedTransaction);
    });
  });

  describe('count', () => {
    it('should count transactions with filters', async () => {
      prismaService.transaction.count.mockResolvedValue(5);

      const where = {
        userId: mockTransaction.userId,
        type: TransactionType.EXPENSE,
      };
      const result = await repository.count(where);

      expect(prismaService.transaction.count).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
      });
      expect(result).toBe(5);
    });

    it('should exclude soft-deleted transactions', async () => {
      prismaService.transaction.count.mockResolvedValue(0);

      const where = { userId: mockTransaction.userId };
      const result = await repository.count(where);

      expect(prismaService.transaction.count).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
      });
      expect(result).toBe(0);
    });
  });

  describe('aggregate', () => {
    it('should calculate totals correctly without groupBy', async () => {
      const aggregateResult = {
        _sum: {
          amount: '500.00',
        },
        _count: {
          _all: 3,
        },
      };

      prismaService.transaction.aggregate.mockResolvedValue(aggregateResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(where);

      expect(prismaService.transaction.aggregate).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
      });
      expect(result).toEqual({
        totalAmount: '500.00',
        transactionCount: 3,
      });
    });

    it('should handle empty results', async () => {
      const aggregateResult = {
        _sum: {
          amount: null,
        },
        _count: {
          _all: 0,
        },
      };

      prismaService.transaction.aggregate.mockResolvedValue(aggregateResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(where);

      expect(result).toEqual({
        totalAmount: '0',
        transactionCount: 0,
      });
    });

    it('should group by category', async () => {
      const groupByResult = [
        {
          categoryId: 'category-id-1',
          _sum: {
            amount: '200.00',
          },
          _count: {
            _all: 2,
          },
        },
        {
          categoryId: 'category-id-2',
          _sum: {
            amount: '300.00',
          },
          _count: {
            _all: 1,
          },
        },
      ];

      prismaService.transaction.groupBy.mockResolvedValue(groupByResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(
        where,
        TransactionStatisticsGroupBy.CATEGORY,
      );

      expect(prismaService.transaction.groupBy).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        by: ['categoryId'],
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          categoryId: 'asc',
        },
      });
      expect(result).toEqual([
        {
          categoryId: 'category-id-1',
          currencyCode: undefined,
          date: undefined,
          totalAmount: '200.00',
          transactionCount: 2,
        },
        {
          categoryId: 'category-id-2',
          currencyCode: undefined,
          date: undefined,
          totalAmount: '300.00',
          transactionCount: 1,
        },
      ]);
    });

    it('should group by currency', async () => {
      const groupByResult = [
        {
          currencyCode: CurrencyCode.USD,
          _sum: {
            amount: '400.00',
          },
          _count: {
            _all: 2,
          },
        },
        {
          currencyCode: CurrencyCode.EUR,
          _sum: {
            amount: '100.00',
          },
          _count: {
            _all: 1,
          },
        },
      ];

      prismaService.transaction.groupBy.mockResolvedValue(groupByResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(
        where,
        TransactionStatisticsGroupBy.CURRENCY,
      );

      expect(prismaService.transaction.groupBy).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        by: ['currencyCode'],
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          currencyCode: 'asc',
        },
      });
      expect(result).toEqual([
        {
          categoryId: undefined,
          currencyCode: CurrencyCode.USD,
          date: undefined,
          totalAmount: '400.00',
          transactionCount: 2,
        },
        {
          categoryId: undefined,
          currencyCode: CurrencyCode.EUR,
          date: undefined,
          totalAmount: '100.00',
          transactionCount: 1,
        },
      ]);
    });

    it('should group by month', async () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-02-20');
      const groupByResult = [
        {
          date: date1,
          _sum: {
            amount: '250.00',
          },
          _count: {
            _all: 1,
          },
        },
        {
          date: date2,
          _sum: {
            amount: '250.00',
          },
          _count: {
            _all: 1,
          },
        },
      ];

      prismaService.transaction.groupBy.mockResolvedValue(groupByResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(
        where,
        TransactionStatisticsGroupBy.MONTH,
      );

      expect(prismaService.transaction.groupBy).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        by: ['date'],
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
      expect(result).toEqual([
        {
          categoryId: undefined,
          currencyCode: undefined,
          date: date1,
          totalAmount: '250.00',
          transactionCount: 1,
        },
        {
          categoryId: undefined,
          currencyCode: undefined,
          date: date2,
          totalAmount: '250.00',
          transactionCount: 1,
        },
      ]);
    });

    it('should group by year', async () => {
      const date1 = new Date('2023-06-15');
      const date2 = new Date('2024-03-20');
      const groupByResult = [
        {
          date: date1,
          _sum: {
            amount: '150.00',
          },
          _count: {
            _all: 1,
          },
        },
        {
          date: date2,
          _sum: {
            amount: '350.00',
          },
          _count: {
            _all: 1,
          },
        },
      ];

      prismaService.transaction.groupBy.mockResolvedValue(groupByResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(
        where,
        TransactionStatisticsGroupBy.YEAR,
      );

      expect(prismaService.transaction.groupBy).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        by: ['date'],
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
      expect(result).toEqual([
        {
          categoryId: undefined,
          currencyCode: undefined,
          date: date1,
          totalAmount: '150.00',
          transactionCount: 1,
        },
        {
          categoryId: undefined,
          currencyCode: undefined,
          date: date2,
          totalAmount: '350.00',
          transactionCount: 1,
        },
      ]);
    });

    it('should apply filters when grouping', async () => {
      const groupByResult: (typeof mockTransaction)[] = [];
      prismaService.transaction.groupBy.mockResolvedValue(groupByResult);

      const where = {
        userId: mockTransaction.userId,
        type: TransactionType.INCOME,
      };
      const result = await repository.aggregate(
        where,
        TransactionStatisticsGroupBy.CATEGORY,
      );

      expect(prismaService.transaction.groupBy).toHaveBeenCalledWith({
        where: {
          ...where,
          deletedAt: null,
        },
        by: ['categoryId'],
        _sum: {
          amount: true,
        },
        _count: {
          _all: true,
        },
        orderBy: {
          categoryId: 'asc',
        },
      });
      expect(result).toEqual([]);
    });

    it('should handle null amount in groupBy', async () => {
      const groupByResult = [
        {
          categoryId: 'category-id-1',
          _sum: {
            amount: null,
          },
          _count: {
            _all: 0,
          },
        },
      ];

      prismaService.transaction.groupBy.mockResolvedValue(groupByResult);

      const where = { userId: mockTransaction.userId };
      const result = await repository.aggregate(
        where,
        TransactionStatisticsGroupBy.CATEGORY,
      );

      expect(result).toEqual([
        {
          categoryId: 'category-id-1',
          currencyCode: undefined,
          date: undefined,
          totalAmount: '0',
          transactionCount: 0,
        },
      ]);
    });
  });
});
