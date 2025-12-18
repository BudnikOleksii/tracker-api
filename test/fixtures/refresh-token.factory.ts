import { Prisma } from '../../generated/prisma/client';

export class RefreshTokenFactory {
  static create(
    userId: string,
    overrides?: Partial<Prisma.RefreshTokenUncheckedCreateInput>,
  ): Prisma.RefreshTokenUncheckedCreateInput {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return {
      userId,
      token: `refresh-token-${Date.now()}-${Math.random()}`,
      expiresAt,
      ...overrides,
    };
  }

  static createExpired(
    userId: string,
    overrides?: Partial<Prisma.RefreshTokenUncheckedCreateInput>,
  ): Prisma.RefreshTokenUncheckedCreateInput {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 1);

    return this.create(userId, {
      ...overrides,
      expiresAt,
    });
  }

  static createRevoked(
    userId: string,
    overrides?: Partial<Prisma.RefreshTokenUncheckedCreateInput>,
  ): Prisma.RefreshTokenUncheckedCreateInput {
    return this.create(userId, {
      ...overrides,
      revokedAt: new Date(),
    });
  }
}
