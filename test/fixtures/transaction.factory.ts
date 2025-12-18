import {
  Prisma,
  TransactionType,
  CurrencyCode,
} from '../../generated/prisma/client';

export class TransactionFactory {
  static create(
    userId: string,
    categoryId: string,
    overrides?: Partial<Prisma.TransactionUncheckedCreateInput>,
  ): Prisma.TransactionUncheckedCreateInput {
    return {
      userId,
      categoryId,
      type: TransactionType.EXPENSE,
      amount: 100.0,
      currencyCode: CurrencyCode.USD,
      date: new Date(),
      ...overrides,
    };
  }

  static createIncome(
    userId: string,
    categoryId: string,
    overrides?: Partial<Prisma.TransactionUncheckedCreateInput>,
  ): Prisma.TransactionUncheckedCreateInput {
    return this.create(userId, categoryId, {
      ...overrides,
      type: TransactionType.INCOME,
    });
  }

  static createExpense(
    userId: string,
    categoryId: string,
    overrides?: Partial<Prisma.TransactionUncheckedCreateInput>,
  ): Prisma.TransactionUncheckedCreateInput {
    return this.create(userId, categoryId, {
      ...overrides,
      type: TransactionType.EXPENSE,
    });
  }

  static createMany(
    userId: string,
    categoryId: string,
    count: number,
    overrides?: Partial<Prisma.TransactionUncheckedCreateInput>,
  ): Prisma.TransactionUncheckedCreateInput[] {
    return Array.from({ length: count }, (_, index) =>
      this.create(userId, categoryId, {
        ...overrides,
        amount: (index + 1) * 10.0,
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      }),
    );
  }
}
