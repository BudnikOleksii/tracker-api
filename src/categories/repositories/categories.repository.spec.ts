import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { CategoriesRepository } from './categories.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../../../generated/prisma/enums';
import { Category } from '../../../generated/prisma/client';

describe('CategoriesRepository', () => {
  let repository: CategoriesRepository;
  let prismaService: {
    category: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    transaction: {
      count: jest.Mock;
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

  const mockCategoryWithParent: Category = {
    ...mockCategory,
    id: 'subcategory-id',
    name: 'Subcategory',
    parentCategoryId: 'parent-category-id',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      category: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      transaction: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<CategoriesRepository>(CategoriesRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUnique', () => {
    it('should find category by ID', async () => {
      const categoryWithRelations = {
        ...mockCategory,
        parentCategory: null,
        subcategories: [],
      };

      prismaService.category.findUnique.mockResolvedValue(
        categoryWithRelations,
      );

      const result = await repository.findUnique({ id: mockCategory.id });

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(categoryWithRelations);
    });

    it('should include parent category', async () => {
      const categoryWithRelations = {
        ...mockCategoryWithParent,
        parentCategory: mockCategory,
        subcategories: [],
      };

      prismaService.category.findUnique.mockResolvedValue(
        categoryWithRelations,
      );

      const result = await repository.findUnique({
        id: mockCategoryWithParent.id,
      });

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: mockCategoryWithParent.id },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(categoryWithRelations);
    });

    it('should return null for non-existent category', async () => {
      prismaService.category.findUnique.mockResolvedValue(null);

      const result = await repository.findUnique({ id: 'non-existent-id' });

      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('findFirst', () => {
    it('should find first matching category', async () => {
      const categoryWithRelations = {
        ...mockCategory,
        parentCategory: null,
        subcategories: [],
      };

      prismaService.category.findFirst.mockResolvedValue(categoryWithRelations);

      const where = { userId: mockCategory.userId, name: mockCategory.name };
      const result = await repository.findFirst(where);

      expect(prismaService.category.findFirst).toHaveBeenCalledWith({
        where,
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(categoryWithRelations);
    });

    it('should return null when no match', async () => {
      prismaService.category.findFirst.mockResolvedValue(null);

      const where = { userId: 'user-id', name: 'Non-existent' };
      const result = await repository.findFirst(where);

      expect(prismaService.category.findFirst).toHaveBeenCalledWith({
        where,
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return user categories', async () => {
      const categoriesWithRelations = [
        {
          ...mockCategory,
          parentCategory: null,
          subcategories: [],
        },
      ];

      prismaService.category.findMany.mockResolvedValue(
        categoriesWithRelations,
      );

      const result = await repository.findByUserId(mockCategory.userId);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          deletedAt: null,
        },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(categoriesWithRelations);
    });

    it('should filter by type', async () => {
      const categoriesWithRelations = [
        {
          ...mockCategory,
          type: TransactionType.INCOME,
          parentCategory: null,
          subcategories: [],
        },
      ];

      prismaService.category.findMany.mockResolvedValue(
        categoriesWithRelations,
      );

      const result = await repository.findByUserId(
        mockCategory.userId,
        TransactionType.INCOME,
      );

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          deletedAt: null,
          type: TransactionType.INCOME,
        },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(categoriesWithRelations);
    });

    it('should return hierarchical structure', async () => {
      const categoriesWithRelations = [
        {
          ...mockCategory,
          parentCategory: null,
          subcategories: [mockCategoryWithParent],
        },
        {
          ...mockCategoryWithParent,
          parentCategory: mockCategory,
          subcategories: [],
        },
      ];

      prismaService.category.findMany.mockResolvedValue(
        categoriesWithRelations,
      );

      const result = await repository.findByUserId(mockCategory.userId);

      expect(result).toEqual(categoriesWithRelations);
    });

    it('should exclude soft-deleted categories', async () => {
      const categoriesWithRelations: Category[] = [];

      prismaService.category.findMany.mockResolvedValue(
        categoriesWithRelations,
      );

      const result = await repository.findByUserId(mockCategory.userId);

      expect(prismaService.category.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          deletedAt: null,
        },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(categoriesWithRelations);
    });
  });

  describe('checkCategoryExists', () => {
    it('should return true when category exists', async () => {
      prismaService.category.count.mockResolvedValue(1);

      const result = await repository.checkCategoryExists(
        mockCategory.userId,
        mockCategory.name,
        mockCategory.type,
      );

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          name: mockCategory.name,
          type: mockCategory.type,
          parentCategoryId: null,
          deletedAt: null,
        },
      });
      expect(result).toBe(true);
    });

    it('should return false when category does not exist', async () => {
      prismaService.category.count.mockResolvedValue(0);

      const result = await repository.checkCategoryExists(
        mockCategory.userId,
        'Non-existent',
        TransactionType.INCOME,
      );

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          name: 'Non-existent',
          type: TransactionType.INCOME,
          parentCategoryId: null,
          deletedAt: null,
        },
      });
      expect(result).toBe(false);
    });

    it('should exclude current category ID for updates', async () => {
      prismaService.category.count.mockResolvedValue(0);

      const result = await repository.checkCategoryExists(
        mockCategory.userId,
        mockCategory.name,
        mockCategory.type,
        null,
        mockCategory.id,
      );

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          name: mockCategory.name,
          type: mockCategory.type,
          parentCategoryId: null,
          deletedAt: null,
          id: {
            not: mockCategory.id,
          },
        },
      });
      expect(result).toBe(false);
    });

    it('should handle parent category ID', async () => {
      prismaService.category.count.mockResolvedValue(1);

      const result = await repository.checkCategoryExists(
        mockCategory.userId,
        'Subcategory',
        TransactionType.EXPENSE,
        'parent-category-id',
      );

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          userId: mockCategory.userId,
          name: 'Subcategory',
          type: TransactionType.EXPENSE,
          parentCategoryId: 'parent-category-id',
          deletedAt: null,
        },
      });
      expect(result).toBe(true);
    });
  });

  describe('countSubcategoriesByParentId', () => {
    it('should return correct count', async () => {
      prismaService.category.count.mockResolvedValue(3);

      const result =
        await repository.countSubcategoriesByParentId('parent-category-id');

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          parentCategoryId: 'parent-category-id',
          deletedAt: null,
        },
      });
      expect(result).toBe(3);
    });

    it('should return 0 when no subcategories', async () => {
      prismaService.category.count.mockResolvedValue(0);

      const result =
        await repository.countSubcategoriesByParentId('parent-category-id');

      expect(prismaService.category.count).toHaveBeenCalledWith({
        where: {
          parentCategoryId: 'parent-category-id',
          deletedAt: null,
        },
      });
      expect(result).toBe(0);
    });
  });

  describe('countTransactionsByCategoryId', () => {
    it('should return correct count', async () => {
      prismaService.transaction.count.mockResolvedValue(5);

      const result = await repository.countTransactionsByCategoryId(
        mockCategory.id,
      );

      expect(prismaService.transaction.count).toHaveBeenCalledWith({
        where: {
          categoryId: mockCategory.id,
          deletedAt: null,
        },
      });
      expect(result).toBe(5);
    });

    it('should return 0 when no transactions', async () => {
      prismaService.transaction.count.mockResolvedValue(0);

      const result = await repository.countTransactionsByCategoryId(
        mockCategory.id,
      );

      expect(prismaService.transaction.count).toHaveBeenCalledWith({
        where: {
          categoryId: mockCategory.id,
          deletedAt: null,
        },
      });
      expect(result).toBe(0);
    });
  });

  describe('create', () => {
    it('should create category with all fields', async () => {
      const createData = {
        userId: mockCategory.userId,
        name: 'New Category',
        type: TransactionType.INCOME,
        parentCategoryId: null,
      };

      const createdCategory = {
        ...mockCategory,
        ...createData,
        parentCategory: null,
        subcategories: [],
      };

      prismaService.category.create.mockResolvedValue(createdCategory);

      const result = await repository.create(createData);

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          name: createData.name,
          type: createData.type,
          parentCategoryId: createData.parentCategoryId,
        },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(createdCategory);
    });

    it('should create subcategory with parent', async () => {
      const createData = {
        userId: mockCategory.userId,
        name: 'Subcategory',
        type: TransactionType.EXPENSE,
        parentCategoryId: 'parent-category-id',
      };

      const createdCategory = {
        ...mockCategoryWithParent,
        ...createData,
        parentCategory: mockCategory,
        subcategories: [],
      };

      prismaService.category.create.mockResolvedValue(createdCategory);

      const result = await repository.create(createData);

      expect(prismaService.category.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          name: createData.name,
          type: createData.type,
          parentCategoryId: createData.parentCategoryId,
        },
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(createdCategory);
    });
  });

  describe('update', () => {
    it('should update category fields', async () => {
      const updateData = {
        name: 'Updated Category',
      };

      const updatedCategory = {
        ...mockCategory,
        ...updateData,
        parentCategory: null,
        subcategories: [],
      };

      prismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await repository.update(
        { id: mockCategory.id },
        updateData,
      );

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: updateData,
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(updatedCategory);
    });

    it('should update parent category', async () => {
      const updateData = {
        parentCategoryId: 'new-parent-id',
      };

      const updatedCategory = {
        ...mockCategory,
        ...updateData,
        parentCategory: mockCategory,
        subcategories: [],
      };

      prismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await repository.update(
        { id: mockCategory.id },
        updateData,
      );

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: updateData,
        include: {
          parentCategory: true,
          subcategories: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt timestamp', async () => {
      const deletedCategory = {
        ...mockCategory,
        deletedAt: new Date(),
      };

      prismaService.category.update.mockResolvedValue(deletedCategory);

      const result = await repository.softDelete({ id: mockCategory.id });

      expect(prismaService.category.update).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        data: {
          deletedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(deletedCategory);
    });
  });
});
