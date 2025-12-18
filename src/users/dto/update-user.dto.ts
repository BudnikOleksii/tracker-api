import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { CountryCode, CurrencyCode } from '../../../generated/prisma/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Country code',
    enum: CountryCode,
    example: CountryCode.US,
  })
  @IsOptional()
  @IsEnum(CountryCode)
  countryCode?: CountryCode;

  @ApiPropertyOptional({
    description: 'Base currency code',
    enum: CurrencyCode,
    example: CurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  baseCurrencyCode?: CurrencyCode;
}
