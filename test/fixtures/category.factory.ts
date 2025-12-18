import { Prisma, TransactionType } from '../../generated/prisma/client';

export class CategoryFactory {
  static create(
    userId: string,
    overrides?: Partial<Prisma.CategoryUncheckedCreateInput>,
  ): Prisma.CategoryUncheckedCreateInput {
    return {
      userId,
      name: `Category-${Date.now()}`,
      type: TransactionType.EXPENSE,
      ...overrides,
    };
  }

  static createIncome(
    userId: string,
    overrides?: Partial<Prisma.CategoryUncheckedCreateInput>,
  ): Prisma.CategoryUncheckedCreateInput {
    return this.create(userId, {
      ...overrides,
      type: TransactionType.INCOME,
    });
  }

  static createExpense(
    userId: string,
    overrides?: Partial<Prisma.CategoryUncheckedCreateInput>,
  ): Prisma.CategoryUncheckedCreateInput {
    return this.create(userId, {
      ...overrides,
      type: TransactionType.EXPENSE,
    });
  }

  static createWithParent(
    userId: string,
    parentId: string,
    overrides?: Partial<Prisma.CategoryUncheckedCreateInput>,
  ): Prisma.CategoryUncheckedCreateInput {
    return this.create(userId, {
      ...overrides,
      parentCategoryId: parentId,
    });
  }

  static createMany(
    userId: string,
    count: number,
    overrides?: Partial<Prisma.CategoryUncheckedCreateInput>,
  ): Prisma.CategoryUncheckedCreateInput[] {
    return Array.from({ length: count }, (_, index) =>
      this.create(userId, {
        ...overrides,
        name: `Category-${Date.now()}-${index}`,
      }),
    );
  }
}
