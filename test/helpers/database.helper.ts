import { Prisma, PrismaClient } from '../../generated/prisma/client';

export class DatabaseHelper {
  constructor(private prisma: PrismaClient) {}

  async cleanDatabase(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "RefreshToken", "Transaction", "Category", "User" RESTART IDENTITY CASCADE;
    `);
  }

  async seedDatabase(data: {
    users?: Prisma.UserCreateManyInput[];
    categories?: Prisma.CategoryCreateManyInput[];
    transactions?: Prisma.TransactionCreateManyInput[];
    refreshTokens?: Prisma.RefreshTokenCreateManyInput[];
  }): Promise<void> {
    if (data.users) {
      await this.prisma.user.createMany({ data: data.users });
    }
    if (data.categories) {
      await this.prisma.category.createMany({ data: data.categories });
    }
    if (data.transactions) {
      await this.prisma.transaction.createMany({ data: data.transactions });
    }
    if (data.refreshTokens) {
      await this.prisma.refreshToken.createMany({ data: data.refreshTokens });
    }
  }

  async resetDatabase(): Promise<void> {
    await this.cleanDatabase();
  }

  async runMigrations(): Promise<void> {
    const { execSync } = await import('child_process');
    execSync('pnpm prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
      stdio: 'inherit',
    });
  }
}
