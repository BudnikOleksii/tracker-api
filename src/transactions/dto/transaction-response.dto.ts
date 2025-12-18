import { Exclude, Expose, Type } from 'class-transformer';

import { CurrencyCode, TransactionType } from '../../../generated/prisma/enums';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';

export class TransactionResponseDto {
  @Expose()
  id!: string;

  @Expose()
  categoryId!: string;

  @Expose()
  type!: TransactionType;

  @Expose()
  amount!: string;

  @Expose()
  currencyCode!: CurrencyCode;

  @Expose()
  @Type(() => Date)
  date!: Date;

  @Expose()
  description!: string | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  @Type(() => CategoryResponseDto)
  category!: CategoryResponseDto;

  @Exclude()
  userId!: string;

  @Exclude()
  deletedAt!: Date | null;
}
