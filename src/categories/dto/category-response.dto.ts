import { Exclude, Expose, Type } from 'class-transformer';

import { TransactionType } from '../../../generated/prisma/enums';

export class CategoryResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  type!: TransactionType;

  @Expose()
  parentCategoryId!: string | null;

  @Expose()
  @Type(() => CategoryResponseDto)
  parentCategory!: CategoryResponseDto | null;

  @Expose()
  @Type(() => CategoryResponseDto)
  subcategories!: CategoryResponseDto[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  userId!: string;

  @Exclude()
  deletedAt!: Date | null;
}
