import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

import { TransactionType } from '../../../generated/prisma/enums';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsUUID()
  parentCategoryId?: string | null;
}
