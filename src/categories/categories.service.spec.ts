import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CacheService } from '../cache/cache.service';
import { CategoriesRepository } from './repositories/categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { TransactionType } from '../../generated/prisma/enums';
import { Category } from '../../generated/prisma/client';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: {
    findUnique: jest.Mock;
    findByUserId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
    checkCategoryExists: jest.Mock;
    countSubcategoriesByParentId: jest.Mock;
    countTransactionsByCategoryId: jest.Mock;
  };

  const userId = 'user-id';
  const mockCategory: Category = {
    id: 'category-id',
    userId,
    name: 'Groceries',
    type: TransactionType.EXPENSE,
    parentCategoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockParentCategory: Category = {
    id: 'parent-category-id',
    userId,
    name: 'Food',
    type: TransactionType.EXPENSE,
    parentCategoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockSubcategory: Category = {
    id: 'subcategory-id',
    userId,
    name: 'Vegetables',
    type: TransactionType.EXPENSE,
    parentCategoryId: 'parent-category-id',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockCategoriesRepository = {
      findUnique: jest.fn(),
      findByUserId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      checkCategoryExists: jest.fn(),
      countSubcategoriesByParentId: jest.fn(),
      countTransactionsByCategoryId: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
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

    service = module.get<CategoriesService>(CategoriesService);
    categoriesRepository = module.get(CategoriesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateCategoryDto = {
      name: 'Groceries',
      type: TransactionType.EXPENSE,
    };

    it('should successfully create root category', async () => {
      categoriesRepository.checkCategoryExists.mockResolvedValue(false);
      categoriesRepository.create.mockResolvedValue(mockCategory);

      const result = await service.create(userId, createDto);

      const checkCategoryExistsCall =
        categoriesRepository.checkCategoryExists.mock.calls[0];
      expect(checkCategoryExistsCall[0]).toBe(userId);
      expect(checkCategoryExistsCall[1]).toBe(createDto.name);
      expect(checkCategoryExistsCall[2]).toBe(createDto.type);
      expect(checkCategoryExistsCall[3]).toBeUndefined();
      expect(categoriesRepository.create).toHaveBeenCalledWith({
        userId,
        name: createDto.name,
        type: createDto.type,
        parentCategoryId: undefined,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', createDto.name);
    });

    it('should successfully create subcategory with valid parent', async () => {
      const createSubcategoryDto: CreateCategoryDto = {
        name: 'Vegetables',
        type: TransactionType.EXPENSE,
        parentCategoryId: 'parent-category-id',
      };

      categoriesRepository.findUnique
        .mockResolvedValueOnce(mockParentCategory)
        .mockResolvedValueOnce(null);
      categoriesRepository.checkCategoryExists.mockResolvedValue(false);
      categoriesRepository.create.mockResolvedValue(mockSubcategory);

      const result = await service.create(userId, createSubcategoryDto);

      expect(categoriesRepository.findUnique).toHaveBeenCalledWith({
        id: createSubcategoryDto.parentCategoryId,
      });
      expect(categoriesRepository.checkCategoryExists).toHaveBeenCalledWith(
        userId,
        createSubcategoryDto.name,
        createSubcategoryDto.type,
        createSubcategoryDto.parentCategoryId,
      );
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty(
        'parentCategoryId',
        createSubcategoryDto.parentCategoryId,
      );
    });

    it('should throw ConflictException when category already exists', async () => {
      categoriesRepository.checkCategoryExists.mockResolvedValue(true);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(userId, createDto)).rejects.toThrow(
        ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS,
      );
    });

    it('should validate parent category ownership', async () => {
      const otherUserCategory = {
        ...mockParentCategory,
        userId: 'other-user-id',
      };
      const createSubcategoryDto: CreateCategoryDto = {
        name: 'Vegetables',
        type: TransactionType.EXPENSE,
        parentCategoryId: 'parent-category-id',
      };

      categoriesRepository.findUnique.mockResolvedValue(otherUserCategory);

      await expect(
        service.create(userId, createSubcategoryDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(userId, createSubcategoryDto),
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_PARENT_CATEGORY);
    });

    it('should validate parent category type match', async () => {
      const incomeParent = {
        ...mockParentCategory,
        type: TransactionType.INCOME,
      };
      const createSubcategoryDto: CreateCategoryDto = {
        name: 'Vegetables',
        type: TransactionType.EXPENSE,
        parentCategoryId: 'parent-category-id',
      };

      categoriesRepository.findUnique.mockResolvedValue(incomeParent);

      await expect(
        service.create(userId, createSubcategoryDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(userId, createSubcategoryDto),
      ).rejects.toThrow(ERROR_MESSAGES.PARENT_CATEGORY_TYPE_MISMATCH);
    });

    it('should return CategoryResponseDto', async () => {
      categoriesRepository.checkCategoryExists.mockResolvedValue(false);
      categoriesRepository.create.mockResolvedValue(mockCategory);

      const result = await service.create(userId, createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('type');
    });
  });

  describe('findAll', () => {
    it('should return all root categories for user', async () => {
      const categories = [mockCategory, mockParentCategory];
      categoriesRepository.findByUserId.mockResolvedValue(categories);

      const result = await service.findAll(userId);

      expect(categoriesRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
    });

    it('should filter by transaction type (INCOME)', async () => {
      const incomeCategory = { ...mockCategory, type: TransactionType.INCOME };
      categoriesRepository.findByUserId.mockResolvedValue([incomeCategory]);

      const result = await service.findAll(userId, TransactionType.INCOME);

      expect(categoriesRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        TransactionType.INCOME,
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(TransactionType.INCOME);
    });

    it('should filter by transaction type (EXPENSE)', async () => {
      categoriesRepository.findByUserId.mockResolvedValue([mockCategory]);

      const result = await service.findAll(userId, TransactionType.EXPENSE);

      expect(categoriesRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        TransactionType.EXPENSE,
      );
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(TransactionType.EXPENSE);
    });

    it('should return empty array when no categories', async () => {
      categoriesRepository.findByUserId.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toEqual([]);
    });

    it("should only return user's own categories", async () => {
      categoriesRepository.findByUserId.mockResolvedValue([mockCategory]);

      const result = await service.findAll(userId);

      expect(categoriesRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        undefined,
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should successfully find category by ID', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne(userId, mockCategory.id);

      expect(categoriesRepository.findUnique).toHaveBeenCalledWith({
        id: mockCategory.id,
      });
      expect(result).toHaveProperty('id', mockCategory.id);
    });

    it('should throw NotFoundException for non-existent category', async () => {
      categoriesRepository.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(userId, 'non-existent-id')).rejects.toThrow(
        ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      );
    });

    it('should throw NotFoundException for deleted category', async () => {
      const deletedCategory = { ...mockCategory, deletedAt: new Date() };
      categoriesRepository.findUnique.mockResolvedValue(deletedCategory);

      await expect(service.findOne(userId, mockCategory.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException for other user's category", async () => {
      const otherUserCategory = { ...mockCategory, userId: 'other-user-id' };
      categoriesRepository.findUnique.mockResolvedValue(otherUserCategory);

      await expect(service.findOne(userId, mockCategory.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCategoryDto = {
      name: 'Updated Groceries',
      type: TransactionType.EXPENSE,
    };

    it('should successfully update category', async () => {
      const updatedCategory = { ...mockCategory, name: updateDto.name };
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(0);
      categoriesRepository.checkCategoryExists.mockResolvedValue(false);
      categoriesRepository.update.mockResolvedValue(updatedCategory);

      const result = await service.update(userId, mockCategory.id, updateDto);

      expect(categoriesRepository.findUnique).toHaveBeenCalledWith({
        id: mockCategory.id,
      });
      expect(categoriesRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('name', updateDto.name);
    });

    it('should throw NotFoundException for non-existent category', async () => {
      categoriesRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for circular reference (self)', async () => {
      const updateWithSelfDto: UpdateCategoryDto = {
        ...updateDto,
        parentCategoryId: mockCategory.id,
      };

      categoriesRepository.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.update(userId, mockCategory.id, updateWithSelfDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(userId, mockCategory.id, updateWithSelfDto),
      ).rejects.toThrow(ERROR_MESSAGES.CIRCULAR_CATEGORY_REFERENCE);
    });

    it('should throw BadRequestException for circular reference (ancestor)', async () => {
      const updateWithAncestorDto: UpdateCategoryDto = {
        ...updateDto,
        parentCategoryId: 'subcategory-id',
      };

      const subcategoryWithParent = {
        ...mockSubcategory,
        id: 'subcategory-id',
        parentCategoryId: mockCategory.id,
      };

      categoriesRepository.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(subcategoryWithParent)
        .mockResolvedValueOnce(subcategoryWithParent)
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(subcategoryWithParent)
        .mockResolvedValueOnce(subcategoryWithParent);

      await expect(
        service.update(userId, mockCategory.id, updateWithAncestorDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(userId, mockCategory.id, updateWithAncestorDto),
      ).rejects.toThrow(ERROR_MESSAGES.CIRCULAR_CATEGORY_REFERENCE);
    });

    it('should validate parent category ownership', async () => {
      const otherUserCategory = {
        ...mockParentCategory,
        userId: 'other-user-id',
      };
      const updateWithParentDto: UpdateCategoryDto = {
        ...updateDto,
        parentCategoryId: 'parent-category-id',
      };

      categoriesRepository.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(otherUserCategory);

      await expect(
        service.update(userId, mockCategory.id, updateWithParentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate parent category type match', async () => {
      const incomeParent = {
        ...mockParentCategory,
        type: TransactionType.INCOME,
      };
      const updateWithParentDto: UpdateCategoryDto = {
        ...updateDto,
        parentCategoryId: 'parent-category-id',
      };

      categoriesRepository.findUnique
        .mockResolvedValueOnce(mockCategory)
        .mockResolvedValueOnce(incomeParent);

      await expect(
        service.update(userId, mockCategory.id, updateWithParentDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when name/type/parent combination exists', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(0);
      categoriesRepository.checkCategoryExists.mockResolvedValue(true);

      await expect(
        service.update(userId, mockCategory.id, updateDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should prevent type change when has subcategories', async () => {
      const updateTypeDto: UpdateCategoryDto = {
        ...updateDto,
        type: TransactionType.INCOME,
      };

      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(1);

      await expect(
        service.update(userId, mockCategory.id, updateTypeDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent type change when parent type differs', async () => {
      const categoryWithParent = {
        ...mockCategory,
        parentCategoryId: 'parent-id',
        type: TransactionType.EXPENSE,
      };
      const incomeParent = {
        ...mockParentCategory,
        id: 'parent-id',
        type: TransactionType.INCOME,
      };
      const updateTypeDto: UpdateCategoryDto = {
        ...updateDto,
        type: TransactionType.EXPENSE,
      };

      categoriesRepository.findUnique
        .mockResolvedValueOnce(categoryWithParent)
        .mockResolvedValueOnce(incomeParent)
        .mockResolvedValueOnce(categoryWithParent)
        .mockResolvedValueOnce(incomeParent);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(0);

      await expect(
        service.update(userId, mockCategory.id, updateTypeDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(userId, mockCategory.id, updateTypeDto),
      ).rejects.toThrow(ERROR_MESSAGES.PARENT_CATEGORY_TYPE_MISMATCH);
    });
  });

  describe('remove', () => {
    it('should successfully delete category', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(0);
      categoriesRepository.countTransactionsByCategoryId.mockResolvedValue(0);
      categoriesRepository.softDelete.mockResolvedValue(mockCategory);

      await service.remove(userId, mockCategory.id);

      expect(categoriesRepository.findUnique).toHaveBeenCalledWith({
        id: mockCategory.id,
      });
      expect(categoriesRepository.softDelete).toHaveBeenCalledWith({
        id: mockCategory.id,
      });
    });

    it('should throw NotFoundException for non-existent category', async () => {
      categoriesRepository.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when category has subcategories', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(2);

      await expect(service.remove(userId, mockCategory.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.remove(userId, mockCategory.id)).rejects.toThrow(
        ERROR_MESSAGES.CATEGORY_HAS_SUBCATEGORIES,
      );
    });

    it('should throw ConflictException when category has transactions', async () => {
      categoriesRepository.findUnique.mockResolvedValue(mockCategory);
      categoriesRepository.countSubcategoriesByParentId.mockResolvedValue(0);
      categoriesRepository.countTransactionsByCategoryId.mockResolvedValue(5);

      await expect(service.remove(userId, mockCategory.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.remove(userId, mockCategory.id)).rejects.toThrow(
        ERROR_MESSAGES.CATEGORY_HAS_TRANSACTIONS,
      );
    });
  });
});
