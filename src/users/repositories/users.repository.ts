import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../../generated/prisma/enums';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  emailVerificationToken: string;
  emailVerificationTokenExpiresAt: Date;
  countryCode?: CountryCode;
  baseCurrencyCode?: CurrencyCode;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateUserData {
  countryCode?: CountryCode;
  baseCurrencyCode?: CurrencyCode;
  role?: UserRole;
  emailVerified?: boolean;
  emailVerificationToken?: string | null;
  emailVerificationTokenExpiresAt?: Date | null;
}

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findUnique(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({
      where,
    });
  }

  async findFirst(where: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({
      where,
    });
  }

  async create(data: CreateUserData) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        emailVerificationToken: data.emailVerificationToken,
        emailVerificationTokenExpiresAt: data.emailVerificationTokenExpiresAt,
        countryCode: data.countryCode,
        baseCurrencyCode: data.baseCurrencyCode,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async update(where: Prisma.UserWhereUniqueInput, data: UpdateUserData) {
    return this.prisma.user.update({
      where,
      data,
    });
  }
}
