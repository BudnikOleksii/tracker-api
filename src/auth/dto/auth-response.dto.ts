import { Exclude } from 'class-transformer';

import { UserRole, CountryCode, CurrencyCode } from '../../../generated/prisma/enums';

export class UserResponseDto {
  id!: string;
  email!: string;
  emailVerified!: boolean;
  countryCode!: CountryCode | null;
  baseCurrencyCode!: CurrencyCode | null;
  role!: UserRole;
  createdAt!: Date;
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

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: UserResponseDto;
}

