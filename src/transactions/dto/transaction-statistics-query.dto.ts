import { IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CurrencyCode, TransactionType } from '../../../generated/prisma/enums';

export enum TransactionStatisticsGroupBy {
  CATEGORY = 'category',
  CURRENCY = 'currency',
  MONTH = 'month',
  YEAR = 'year',
}

export class TransactionStatisticsQueryDto {
  @ApiPropertyOptional({
    description: 'Start date for statistics calculation',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @ApiPropertyOptional({
    description: 'End date for statistics calculation',
    type: String,
    format: 'date-time',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: TransactionType,
    enumName: 'TransactionType',
    example: TransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filter by currency code',
    enum: CurrencyCode,
    enumName: 'CurrencyCode',
    example: CurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currencyCode?: CurrencyCode;

  @ApiPropertyOptional({
    description: 'Group statistics by',
    enum: TransactionStatisticsGroupBy,
    enumName: 'TransactionStatisticsGroupBy',
    example: TransactionStatisticsGroupBy.CATEGORY,
  })
  @IsOptional()
  @IsEnum(TransactionStatisticsGroupBy)
  groupBy?: TransactionStatisticsGroupBy;
}
