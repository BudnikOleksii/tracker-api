import { Prisma, UserRole } from '../../generated/prisma/client';

export class UserFactory {
  static create(
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Prisma.UserUncheckedCreateInput {
    return {
      email: `user-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: '$2b$10$dummyHashForTesting',
      emailVerified: true,
      role: UserRole.USER,
      ...overrides,
    };
  }

  static createMany(
    count: number,
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Prisma.UserUncheckedCreateInput[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        ...overrides,
        email: `user-${Date.now()}-${index}@example.com`,
      }),
    );
  }

  static createVerified(
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Prisma.UserUncheckedCreateInput {
    return this.create({
      ...overrides,
      emailVerified: true,
    });
  }

  static createUnverified(
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Prisma.UserUncheckedCreateInput {
    return this.create({
      ...overrides,
      emailVerified: false,
    });
  }

  static createAdmin(
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Prisma.UserUncheckedCreateInput {
    return this.create({
      ...overrides,
      role: UserRole.ADMIN,
      emailVerified: true,
    });
  }
}
