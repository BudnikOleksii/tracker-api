import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

import { CurrencyCode, TransactionType } from '../../../generated/prisma/enums';

export enum TransactionStatisticsGroupBy {
  CATEGORY = 'category',
  CURRENCY = 'currency',
  MONTH = 'month',
  YEAR = 'year',
}

export class TransactionStatisticsQueryDto {
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsEnum(CurrencyCode)
  currencyCode?: CurrencyCode;

  @IsOptional()
  @IsEnum(TransactionStatisticsGroupBy)
  groupBy?: TransactionStatisticsGroupBy;
}
