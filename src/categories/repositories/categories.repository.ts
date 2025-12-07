import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType } from '../../../generated/prisma/enums';

export interface CreateCategoryData {
  userId: string;
  name: string;
  type: TransactionType;
  parentCategoryId?: string | null;
}

export interface UpdateCategoryData {
  name?: string;
  type?: TransactionType;
  parentCategoryId?: string | null;
}

@Injectable()
export class CategoriesRepository {
  constructor(private prisma: PrismaService) {}

  async findUnique(where: Prisma.CategoryWhereUniqueInput) {
    return this.prisma.category.findUnique({
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
  }

  async findFirst(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.findFirst({
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
  }

  async findMany(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.findMany({
      where,
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
  }

  async create(data: CreateCategoryData) {
    return this.prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        parentCategoryId: data.parentCategoryId,
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
  }

  async update(
    where: Prisma.CategoryWhereUniqueInput,
    data: UpdateCategoryData,
  ) {
    return this.prisma.category.update({
      where,
      data,
      include: {
        parentCategory: true,
        subcategories: {
          where: {
            deletedAt: null,
          },
        },
      },
    });
  }

  async softDelete(where: Prisma.CategoryWhereUniqueInput) {
    return this.prisma.category.update({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async count(where: Prisma.CategoryWhereInput) {
    return this.prisma.category.count({
      where,
    });
  }
}
