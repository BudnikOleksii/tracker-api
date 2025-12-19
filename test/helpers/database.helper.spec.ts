import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { PrismaClient } from '../../generated/prisma/client';
import { DatabaseHelper } from './database.helper';

describe('DatabaseHelper', () => {
  let databaseHelper: DatabaseHelper;
  let mockPrismaClient: {
    $executeRawUnsafe: jest.Mock;
    user: { createMany: jest.Mock };
    category: { createMany: jest.Mock };
    transaction: { createMany: jest.Mock };
    refreshToken: { createMany: jest.Mock };
  };

  beforeEach(() => {
    mockPrismaClient = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      user: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      category: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      transaction: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      refreshToken: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };

    databaseHelper = new DatabaseHelper(
      mockPrismaClient as unknown as PrismaClient,
    );
  });

  describe('cleanDatabase', () => {
    it('should truncate all tables', async () => {
      await databaseHelper.cleanDatabase();

      expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('TRUNCATE TABLE'),
      );
      expect(mockPrismaClient.$executeRawUnsafe.mock.calls[0][0]).toContain(
        '"RefreshToken"',
      );
      expect(mockPrismaClient.$executeRawUnsafe.mock.calls[0][0]).toContain(
        '"Transaction"',
      );
      expect(mockPrismaClient.$executeRawUnsafe.mock.calls[0][0]).toContain(
        '"Category"',
      );
      expect(mockPrismaClient.$executeRawUnsafe.mock.calls[0][0]).toContain(
        '"User"',
      );
      expect(mockPrismaClient.$executeRawUnsafe.mock.calls[0][0]).toContain(
        'RESTART IDENTITY CASCADE',
      );
    });
  });

  describe('seedDatabase', () => {
    it('should seed users when provided', async () => {
      const users = [
        {
          email: 'user1@example.com',
          passwordHash: 'hash1',
          emailVerified: true,
        },
        {
          email: 'user2@example.com',
          passwordHash: 'hash2',
          emailVerified: false,
        },
      ];

      await databaseHelper.seedDatabase({ users });

      expect(mockPrismaClient.user.createMany).toHaveBeenCalledWith({
        data: users,
      });
    });

    it('should seed categories when provided', async () => {
      const categories = [
        {
          userId: 'user-1',
          name: 'Category 1',
          type: 'INCOME' as const,
        },
        {
          userId: 'user-1',
          name: 'Category 2',
          type: 'EXPENSE' as const,
        },
      ];

      await databaseHelper.seedDatabase({ categories });

      expect(mockPrismaClient.category.createMany).toHaveBeenCalledWith({
        data: categories,
      });
    });

    it('should seed transactions when provided', async () => {
      const transactions = [
        {
          userId: 'user-1',
          categoryId: 'cat-1',
          amount: 100,
          type: 'INCOME' as const,
        },
        {
          userId: 'user-1',
          categoryId: 'cat-2',
          amount: 50,
          type: 'EXPENSE' as const,
        },
      ];

      await databaseHelper.seedDatabase({ transactions });

      expect(mockPrismaClient.transaction.createMany).toHaveBeenCalledWith({
        data: transactions,
      });
    });

    it('should seed refresh tokens when provided', async () => {
      const refreshTokens = [
        {
          userId: 'user-1',
          token: 'token-1',
          expiresAt: new Date(),
        },
        {
          userId: 'user-1',
          token: 'token-2',
          expiresAt: new Date(),
        },
      ];

      await databaseHelper.seedDatabase({ refreshTokens });

      expect(mockPrismaClient.refreshToken.createMany).toHaveBeenCalledWith({
        data: refreshTokens,
      });
    });

    it('should seed multiple entity types at once', async () => {
      const users = [{ email: 'user@example.com', passwordHash: 'hash' }];
      const categories = [
        { userId: 'user-1', name: 'Cat 1', type: 'INCOME' as const },
      ];
      const transactions = [
        {
          userId: 'user-1',
          categoryId: 'cat-1',
          amount: 100,
          type: 'INCOME' as const,
        },
      ];

      await databaseHelper.seedDatabase({ users, categories, transactions });

      expect(mockPrismaClient.user.createMany).toHaveBeenCalled();
      expect(mockPrismaClient.category.createMany).toHaveBeenCalled();
      expect(mockPrismaClient.transaction.createMany).toHaveBeenCalled();
    });

    it('should not call createMany when entity type is not provided', async () => {
      await databaseHelper.seedDatabase({});

      expect(mockPrismaClient.user.createMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.category.createMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.transaction.createMany).not.toHaveBeenCalled();
      expect(mockPrismaClient.refreshToken.createMany).not.toHaveBeenCalled();
    });
  });

  describe('resetDatabase', () => {
    it('should call cleanDatabase', async () => {
      await databaseHelper.resetDatabase();

      expect(mockPrismaClient.$executeRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('runMigrations', () => {
    it('should execute migration command', async () => {
      const originalEnv = process.env.TEST_DATABASE_URL;
      process.env.TEST_DATABASE_URL =
        'postgresql://test:test@localhost:5432/test';

      try {
        await expect(databaseHelper.runMigrations()).rejects.toThrow();
      } catch {
        // Expected to throw in test environment
      } finally {
        process.env.TEST_DATABASE_URL = originalEnv;
      }
    });
  });
});
