import { Exclude, Expose } from 'class-transformer';

import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../../generated/prisma/enums';

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  emailVerified!: boolean;

  @Expose()
  countryCode!: CountryCode | null;

  @Expose()
  baseCurrencyCode!: CurrencyCode | null;

  @Expose()
  role!: UserRole;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  passwordHash!: string;

  @Exclude()
  emailVerificationToken!: string | null;

  @Exclude()
  emailVerificationTokenExpiresAt!: Date | null;

  @Exclude()
  ipAddress!: string | null;

  @Exclude()
  userAgent!: string | null;

  @Exclude()
  deletedAt!: Date | null;
}
