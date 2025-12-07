import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { Category } from '../../generated/prisma/client';
import { CategoriesRepository } from './repositories/categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { TransactionType } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';

@Injectable()
export class CategoriesService {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async create(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    if (dto.parentCategoryId) {
      await this.validateParentCategory(userId, dto.parentCategoryId, dto.type);
    }

    const categoryExists = await this.categoriesRepository.checkCategoryExists(
      userId,
      dto.name,
      dto.type,
      dto.parentCategoryId,
    );

    if (categoryExists) {
      throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
    }

    const category = await this.categoriesRepository.create({
      userId,
      name: dto.name,
      type: dto.type,
      parentCategoryId: dto.parentCategoryId,
    });

    return this.mapCategoryToDto(category);
  }

  async findAll(
    userId: string,
    type?: TransactionType,
  ): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.findByUserId(
      userId,
      type,
    );

    const rootCategories = categories.filter(
      (category) => category.parentCategoryId === null,
    );

    return rootCategories.map((category) => this.mapCategoryToDto(category));
  }

  async findOne(userId: string, id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findUnique({ id });

    if (!category || category.deletedAt || category.userId !== userId) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return this.mapCategoryToDto(category);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const currentCategory = await this.validateCategoryOwnership(userId, id);

    if (dto.parentCategoryId === id) {
      throw new BadRequestException(ERROR_MESSAGES.CIRCULAR_CATEGORY_REFERENCE);
    }

    if (dto.parentCategoryId) {
      await this.validateParentCategory(userId, dto.parentCategoryId, dto.type);

      await this.checkCircularReference(id, dto.parentCategoryId);
    }

    if (currentCategory.parentCategoryId) {
      const parentCategory = await this.categoriesRepository.findUnique({
        id: currentCategory.parentCategoryId,
      });

      if (parentCategory && parentCategory.type !== dto.type) {
        throw new BadRequestException(
          ERROR_MESSAGES.PARENT_CATEGORY_TYPE_MISMATCH,
        );
      }
    }

    const subcategoriesCount =
      await this.categoriesRepository.countSubcategoriesByParentId(id);

    if (subcategoriesCount > 0 && dto.type !== currentCategory.type) {
      throw new BadRequestException(
        ERROR_MESSAGES.PARENT_CATEGORY_TYPE_MISMATCH,
      );
    }

    const isUniqueFieldsChanging =
      dto.name !== currentCategory.name ||
      dto.type !== currentCategory.type ||
      dto.parentCategoryId !== currentCategory.parentCategoryId;

    if (isUniqueFieldsChanging) {
      const categoryExists =
        await this.categoriesRepository.checkCategoryExists(
          userId,
          dto.name,
          dto.type,
          dto.parentCategoryId,
          id,
        );

      if (categoryExists) {
        throw new ConflictException(ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS);
      }
    }

    const updatedCategory = await this.categoriesRepository.update(
      { id },
      {
        name: dto.name,
        type: dto.type,
        parentCategoryId: dto.parentCategoryId,
      },
    );

    return this.mapCategoryToDto(updatedCategory);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.validateCategoryOwnership(userId, id);

    const subcategoriesCount =
      await this.categoriesRepository.countSubcategoriesByParentId(id);

    if (subcategoriesCount > 0) {
      throw new ConflictException(ERROR_MESSAGES.CATEGORY_HAS_SUBCATEGORIES);
    }

    const transactionsCount =
      await this.categoriesRepository.countTransactionsByCategoryId(id);

    if (transactionsCount > 0) {
      throw new ConflictException(ERROR_MESSAGES.CATEGORY_HAS_TRANSACTIONS);
    }

    await this.categoriesRepository.softDelete({ id });
  }

  private async validateCategoryOwnership(
    userId: string,
    categoryId: string,
  ): Promise<Category> {
    const category = await this.categoriesRepository.findUnique({
      id: categoryId,
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    if (category.userId !== userId) {
      throw new NotFoundException(ERROR_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  private async validateParentCategory(
    userId: string,
    parentCategoryId: string,
    type: TransactionType,
  ): Promise<void> {
    const parentCategory = await this.categoriesRepository.findUnique({
      id: parentCategoryId,
    });

    if (
      !parentCategory ||
      parentCategory.deletedAt ||
      parentCategory.userId !== userId
    ) {
      throw new NotFoundException(ERROR_MESSAGES.INVALID_PARENT_CATEGORY);
    }

    if (parentCategory.type !== type) {
      throw new BadRequestException(
        ERROR_MESSAGES.PARENT_CATEGORY_TYPE_MISMATCH,
      );
    }
  }

  private async checkCircularReference(
    categoryId: string,
    newParentId: string,
  ): Promise<void> {
    let currentParentId: string | null = newParentId;
    const visitedIds = new Set<string>([categoryId]);

    while (currentParentId) {
      if (visitedIds.has(currentParentId)) {
        throw new BadRequestException(
          ERROR_MESSAGES.CIRCULAR_CATEGORY_REFERENCE,
        );
      }

      visitedIds.add(currentParentId);

      const parent = await this.categoriesRepository.findUnique({
        id: currentParentId,
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentCategoryId;
    }
  }

  private mapCategoryToDto(category: Category): CategoryResponseDto {
    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }
}
