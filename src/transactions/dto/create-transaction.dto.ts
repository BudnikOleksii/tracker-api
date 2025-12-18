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

import { CurrencyCode, TransactionType } from '../../../generated/prisma/enums';

export class CreateTransactionDto {
  @IsUUID()
  categoryId!: string;

  @IsEnum(TransactionType)
  type!: TransactionType;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(CurrencyCode)
  currencyCode!: CurrencyCode;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
