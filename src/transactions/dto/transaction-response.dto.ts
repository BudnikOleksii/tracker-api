import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

import { CurrencyCode, TransactionType } from '../../../generated/prisma/enums';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class TransactionResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Category ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  categoryId!: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: TransactionType,
    example: TransactionType.EXPENSE,
  })
  @Expose()
  type!: TransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: '100.50',
  })
  @Expose()
  amount!: string;

  @ApiProperty({
    description: 'Currency code',
    enum: CurrencyCode,
    example: CurrencyCode.USD,
  })
  @Expose()
  currencyCode!: CurrencyCode;

  @ApiProperty({
    description: 'Transaction date',
    type: Date,
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  date!: Date;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Grocery shopping at supermarket',
    nullable: true,
  })
  @Expose()
  description!: string | null;

  @ApiProperty({
    description: 'Creation date',
    type: Date,
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Last update date',
    type: Date,
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;

  @ApiProperty({
    description: 'Category information',
    type: CategoryResponseDto,
  })
  @Expose()
  @Type(() => CategoryResponseDto)
  category!: CategoryResponseDto;

  @ApiHideProperty()
  @Exclude()
  userId!: string;

  @ApiHideProperty()
  @Exclude()
  deletedAt!: Date | null;
}
