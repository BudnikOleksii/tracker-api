import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { UsersRepository } from './users.repository';
import { PrismaService } from '../../prisma/prisma.service';
import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../../generated/prisma/enums';
import { User } from '../../../generated/prisma/client';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prismaService: {
    user: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const mockUser: User = {
    id: 'user-id',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiresAt: null,
    countryCode: CountryCode.US,
    baseCurrencyCode: CurrencyCode.USD,
    role: UserRole.USER,
    ipAddress: null,
    userAgent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUnique', () => {
    it('should find user by ID', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUnique({ id: mockUser.id });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should find user by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUnique({ email: mockUser.email });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findUnique({ id: 'non-existent-id' });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(result).toBeNull();
    });

    it('should exclude soft-deleted users', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      prismaService.user.findUnique.mockResolvedValue(deletedUser);

      const result = await repository.findUnique({ id: mockUser.id });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(result).toEqual(deletedUser);
    });
  });

  describe('findFirst', () => {
    it('should find first matching user', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const where = { email: mockUser.email };
      const result = await repository.findFirst(where);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where,
      });
      expect(result).toEqual(mockUser);
    });

    it('should apply filters correctly', async () => {
      prismaService.user.findFirst.mockResolvedValue(mockUser);

      const where = {
        email: mockUser.email,
        role: UserRole.USER,
      };
      const result = await repository.findFirst(where);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where,
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no match', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);

      const where = { email: 'non-existent@example.com' };
      const result = await repository.findFirst(where);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where,
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user with all fields', async () => {
      const createData = {
        email: 'newuser@example.com',
        passwordHash: 'hashed-password',
        emailVerificationToken: 'token',
        emailVerificationTokenExpiresAt: new Date(),
        countryCode: CountryCode.US,
        baseCurrencyCode: CurrencyCode.USD,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      const createdUser = {
        ...mockUser,
        ...createData,
      };

      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(createData);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createData.email,
          passwordHash: createData.passwordHash,
          emailVerificationToken: createData.emailVerificationToken,
          emailVerificationTokenExpiresAt:
            createData.emailVerificationTokenExpiresAt,
          countryCode: createData.countryCode,
          baseCurrencyCode: createData.baseCurrencyCode,
          ipAddress: createData.ipAddress,
          userAgent: createData.userAgent,
        },
      });
      expect(result).toEqual(createdUser);
    });

    it('should create user with minimal fields', async () => {
      const createData = {
        email: 'newuser@example.com',
        passwordHash: 'hashed-password',
        emailVerificationToken: 'token',
        emailVerificationTokenExpiresAt: new Date(),
      };

      const createdUser = {
        ...mockUser,
        ...createData,
        countryCode: null,
        baseCurrencyCode: null,
        ipAddress: null,
        userAgent: null,
      };

      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(createData);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: createData.email,
          passwordHash: createData.passwordHash,
          emailVerificationToken: createData.emailVerificationToken,
          emailVerificationTokenExpiresAt:
            createData.emailVerificationTokenExpiresAt,
          countryCode: undefined,
          baseCurrencyCode: undefined,
          ipAddress: undefined,
          userAgent: undefined,
        },
      });
      expect(result).toEqual(createdUser);
    });

    it('should return created user', async () => {
      const createData = {
        email: 'newuser@example.com',
        passwordHash: 'hashed-password',
        emailVerificationToken: 'token',
        emailVerificationTokenExpiresAt: new Date(),
      };

      const createdUser = {
        ...mockUser,
        ...createData,
      };

      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(createData);

      expect(result).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updateData = {
        countryCode: CountryCode.CA,
        baseCurrencyCode: CurrencyCode.CAD,
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
      };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update({ id: mockUser.id }, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update role', async () => {
      const updateData = {
        role: UserRole.ADMIN,
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
      };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update({ id: mockUser.id }, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should update email verification fields', async () => {
      const updateData = {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
      };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update({ id: mockUser.id }, updateData);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should return updated user', async () => {
      const updateData = {
        countryCode: CountryCode.GB,
      };

      const updatedUser = {
        ...mockUser,
        ...updateData,
      };

      prismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update({ id: mockUser.id }, updateData);

      expect(result).toEqual(updatedUser);
    });
  });
});
