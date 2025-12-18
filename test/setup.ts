import { execSync } from 'child_process';
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client';
import { testDatabaseConfig } from './config/test-database.config';

const adapter = new PrismaPg({ connectionString: testDatabaseConfig.url });
const prisma = new PrismaClient({ adapter });

beforeAll(async () => {
  process.env.DATABASE_URL = testDatabaseConfig.url;
  process.env.TEST_DATABASE_URL = testDatabaseConfig.url;

  try {
    await prisma.$connect();
    execSync('pnpm prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDatabaseConfig.url },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  await prisma.$disconnect();
}, 30000);

beforeEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "RefreshToken", "Transaction", "Category", "User" RESTART IDENTITY CASCADE;
  `);
});

afterEach(async () => {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "RefreshToken", "Transaction", "Category", "User" RESTART IDENTITY CASCADE;
  `);
});

jest.setTimeout(30000);

export { prisma };
