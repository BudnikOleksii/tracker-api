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
}

