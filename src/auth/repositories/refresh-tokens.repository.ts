import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateRefreshTokenData {
  userId: string;
  token: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokensRepository {
  constructor(private prisma: PrismaService) {}

  async findUnique(where: Prisma.RefreshTokenWhereUniqueInput) {
    return this.prisma.refreshToken.findUnique({
      where,
    });
  }

  async findUniqueWithUser(where: Prisma.RefreshTokenWhereUniqueInput) {
    return this.prisma.refreshToken.findUnique({
      where,
      include: { user: true },
    });
  }

  async create(data: CreateRefreshTokenData) {
    return this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
      },
    });
  }

  async update(
    where: Prisma.RefreshTokenWhereUniqueInput,
    data: {
      revokedAt?: Date;
      replacedByTokenId?: string;
    },
  ) {
    return this.prisma.refreshToken.update({
      where,
      data,
    });
  }

  async updateMany(
    where: Prisma.RefreshTokenWhereInput,
    data: {
      revokedAt: Date;
    },
  ) {
    return this.prisma.refreshToken.updateMany({
      where,
      data,
    });
  }
}
