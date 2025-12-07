import { IsOptional, IsEnum } from 'class-validator';

import { CountryCode, CurrencyCode } from '../../../generated/prisma/enums';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(CountryCode)
  countryCode?: CountryCode;

  @IsOptional()
  @IsEnum(CurrencyCode)
  baseCurrencyCode?: CurrencyCode;
}

