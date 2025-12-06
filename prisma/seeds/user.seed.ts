/* eslint-disable no-console */
import * as bcrypt from 'bcrypt';

import {
  CountryCode,
  CurrencyCode,
  UserRole,
} from '../../generated/prisma/enums';
import { prisma } from './prisma';

export const createSuperAdminUser = async () => {
  console.log('🔐 Creating SUPER_ADMIN user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
  });

  if (existingUser) {
    console.log(`👤 Found existing SUPER_ADMIN user: ${existingUser.email}`);

    return existingUser;
  } else {
    const user = await prisma.user.create({
      data: {
        email: 'admin@trackmymoney.com',
        passwordHash: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        emailVerified: true,
        countryCode: CountryCode.UA,
        baseCurrencyCode: CurrencyCode.UAH,
      },
    });
    console.log(`✅ Created SUPER_ADMIN user: ${user.email}`);

    return user;
  }
};
