import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { CurrencyCode } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionStatisticsGroupBy } from '../dto/transaction-statistics-query.dto';

export type TransactionWithCategory = Prisma.TransactionGetPayload<{
  include: { category: true };
}>;

export interface TransactionsAggregateSummary {
  totalAmount: string;
  transactionCount: number;
}

export interface TransactionsAggregateGroupItem {
  categoryId?: string;
  currencyCode?: CurrencyCode;
  date?: Date;
  totalAmount: string;
  transactionCount: number;
}

export type CreateTransactionData = Pick<
  Prisma.TransactionUncheckedCreateInput,
  | 'userId'
  | 'categoryId'
  | 'type'
  | 'amount'
  | 'currencyCode'
  | 'date'
  | 'description'
>;

export type UpdateTransactionData = Partial<
  Pick<
    Prisma.TransactionUncheckedUpdateInput,
    'categoryId' | 'type' | 'amount' | 'currencyCode' | 'date' | 'description'
  >
>;

export interface FindManyOptions {
  skip?: number;
  take?: number;
  orderBy?: Prisma.TransactionOrderByWithRelationInput;
}

@Injectable()
export class TransactionsRepository {
  constructor(private prisma: PrismaService) {}

  async findUnique(
    where: Prisma.TransactionWhereUniqueInput,
  ): Promise<TransactionWithCategory | null> {
    return this.prisma.transaction.findUnique({
      where,
      include: {
        category: true,
      },
    });
  }

  async findMany(
    where: Prisma.TransactionWhereInput,
    options?: FindManyOptions,
  ): Promise<TransactionWithCategory[]> {
    return this.prisma.transaction.findMany({
      where: {
        ...where,
        deletedAt: null,
      },
      include: {
        category: true,
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
    });
  }

  async create(data: CreateTransactionData): Promise<TransactionWithCategory> {
    return this.prisma.transaction.create({
      data: {
        userId: data.userId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        currencyCode: data.currencyCode,
        date: data.date,
        description: data.description,
      },
      include: {
        category: true,
      },
    });
  }

  async update(
    where: Prisma.TransactionWhereUniqueInput,
    data: UpdateTransactionData,
  ): Promise<TransactionWithCategory> {
    return this.prisma.transaction.update({
      where,
      data,
      include: {
        category: true,
      },
    });
  }

  async softDelete(where: Prisma.TransactionWhereUniqueInput) {
    return this.prisma.transaction.update({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async count(where: Prisma.TransactionWhereInput): Promise<number> {
    return this.prisma.transaction.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  async aggregate(
    where: Prisma.TransactionWhereInput,
    groupBy?: TransactionStatisticsGroupBy,
  ): Promise<TransactionsAggregateSummary | TransactionsAggregateGroupItem[]> {
    if (!groupBy) {
      const aggregateResult = await this.prisma.transaction.aggregate({
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

      return {
        totalAmount: aggregateResult._sum.amount
          ? aggregateResult._sum.amount.toString()
          : '0',
        transactionCount: aggregateResult._count._all,
      };
    }

    let groupByFields: Prisma.TransactionScalarFieldEnum[] = [];

    if (groupBy === TransactionStatisticsGroupBy.CATEGORY) {
      groupByFields = ['categoryId'];
    }

    if (groupBy === TransactionStatisticsGroupBy.CURRENCY) {
      groupByFields = ['currencyCode'];
    }

    if (
      groupBy === TransactionStatisticsGroupBy.MONTH ||
      groupBy === TransactionStatisticsGroupBy.YEAR
    ) {
      groupByFields = ['date'];
    }

    const groupByResult = await this.prisma.transaction.groupBy({
      where: {
        ...where,
        deletedAt: null,
      },
      by: groupByFields,
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
      orderBy:
        groupByFields.reduce<Prisma.TransactionOrderByWithAggregationInput>(
          (accumulator, field) => {
            return {
              ...accumulator,
              [field]: 'asc',
            };
          },
          {},
        ),
    });

    return groupByResult.map<TransactionsAggregateGroupItem>((item) => {
      return {
        categoryId: item.categoryId,
        currencyCode: item.currencyCode,
        date: item.date,
        totalAmount: item._sum.amount ? item._sum.amount.toString() : '0',
        transactionCount: item._count._all,
      };
    });
  }
}
