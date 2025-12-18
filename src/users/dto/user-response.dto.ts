import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../../generated/prisma/enums';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Whether the email is verified',
    example: true,
  })
  @Expose()
  emailVerified!: boolean;

  @ApiProperty({
    description: 'Country code',
    enum: CountryCode,
    example: CountryCode.US,
    nullable: true,
  })
  @Expose()
  countryCode!: CountryCode | null;

  @ApiProperty({
    description: 'Base currency code',
    enum: CurrencyCode,
    example: CurrencyCode.USD,
    nullable: true,
  })
  @Expose()
  baseCurrencyCode!: CurrencyCode | null;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Expose()
  role!: UserRole;

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

  @ApiHideProperty()
  @Exclude()
  passwordHash!: string;

  @ApiHideProperty()
  @Exclude()
  emailVerificationToken!: string | null;

  @ApiHideProperty()
  @Exclude()
  emailVerificationTokenExpiresAt!: Date | null;

  @ApiHideProperty()
  @Exclude()
  ipAddress!: string | null;

  @ApiHideProperty()
  @Exclude()
  userAgent!: string | null;

  @ApiHideProperty()
  @Exclude()
  deletedAt!: Date | null;
}
