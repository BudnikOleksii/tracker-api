import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsPositive,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CurrencyCode, TransactionType } from '../../../generated/prisma/enums';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Category ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  categoryId!: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({
    description: 'Transaction amount as a positive number',
    example: 100.5,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Currency code',
    enum: CurrencyCode,
    example: CurrencyCode.USD,
  })
  @IsEnum(CurrencyCode)
  currencyCode!: CurrencyCode;

  @ApiProperty({
    description: 'Transaction date',
    format: 'date-time',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({
    description: 'Transaction description',
    example: 'Grocery shopping at supermarket',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
