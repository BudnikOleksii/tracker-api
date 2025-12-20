import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CountryCode, CurrencyCode } from '../../../generated/prisma/enums';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: 'Country code',
    enum: CountryCode,
    enumName: 'CountryCode',
    example: CountryCode.US,
  })
  @IsOptional()
  @IsEnum(CountryCode)
  countryCode?: CountryCode;

  @ApiPropertyOptional({
    description: 'Base currency code',
    enum: CurrencyCode,
    enumName: 'CurrencyCode',
    example: CurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  baseCurrencyCode?: CurrencyCode;
}
