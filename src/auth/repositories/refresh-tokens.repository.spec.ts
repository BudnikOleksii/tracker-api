import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { RefreshTokensRepository } from './refresh-tokens.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshToken, User } from '../../../generated/prisma/client';
import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../../generated/prisma/enums';

describe('RefreshTokensRepository', () => {
  let repository: RefreshTokensRepository;
  let prismaService: {
    refreshToken: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
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

  const mockRefreshToken: RefreshToken = {
    id: 'token-id',
    userId: 'user-id',
    token: 'refresh-token-string',
    deviceInfo: 'Test Device',
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    replacedByTokenId: null,
    revokedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<RefreshTokensRepository>(RefreshTokensRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUnique', () => {
    it('should find token by token string', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

      const result = await repository.findUnique({
        token: mockRefreshToken.token,
      });

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: mockRefreshToken.token },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('should find token by ID', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);

      const result = await repository.findUnique({ id: mockRefreshToken.id });

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('should return null for non-existent token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repository.findUnique({
        token: 'non-existent-token',
      });

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'non-existent-token' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findUniqueWithUser', () => {
    it('should find token with user relation', async () => {
      const tokenWithUser = {
        ...mockRefreshToken,
        user: mockUser,
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(tokenWithUser);

      const result = await repository.findUniqueWithUser({
        token: mockRefreshToken.token,
      });

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: mockRefreshToken.token },
        include: { user: true },
      });
      expect(result).toEqual(tokenWithUser);
      expect(result?.user).toEqual(mockUser);
    });

    it('should return null for non-existent token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      const result = await repository.findUniqueWithUser({
        token: 'non-existent-token',
      });

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'non-existent-token' },
        include: { user: true },
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create refresh token record', async () => {
      const createData = {
        userId: mockRefreshToken.userId,
        token: mockRefreshToken.token,
        deviceInfo: mockRefreshToken.deviceInfo,
        ipAddress: mockRefreshToken.ipAddress,
        userAgent: mockRefreshToken.userAgent,
        expiresAt: mockRefreshToken.expiresAt,
      };

      prismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await repository.create(createData);

      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          token: createData.token,
          deviceInfo: createData.deviceInfo,
          ipAddress: createData.ipAddress,
          userAgent: createData.userAgent,
          expiresAt: createData.expiresAt,
        },
      });
      expect(result).toEqual(mockRefreshToken);
    });

    it('should set expiration date', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const createData = {
        userId: mockRefreshToken.userId,
        token: mockRefreshToken.token,
        expiresAt,
      };

      const createdToken = {
        ...mockRefreshToken,
        expiresAt,
      };

      prismaService.refreshToken.create.mockResolvedValue(createdToken);

      const result = await repository.create(createData);

      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: createData.userId,
          token: createData.token,
          deviceInfo: undefined,
          ipAddress: undefined,
          userAgent: undefined,
          expiresAt: createData.expiresAt,
        },
      });
      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('should store device info', async () => {
      const createData = {
        userId: mockRefreshToken.userId,
        token: mockRefreshToken.token,
        deviceInfo: 'iPhone 13',
        expiresAt: mockRefreshToken.expiresAt,
      };

      const createdToken = {
        ...mockRefreshToken,
        deviceInfo: 'iPhone 13',
      };

      prismaService.refreshToken.create.mockResolvedValue(createdToken);

      const result = await repository.create(createData);

      expect(result.deviceInfo).toBe('iPhone 13');
    });

    it('should store IP address and user agent', async () => {
      const createData = {
        userId: mockRefreshToken.userId,
        token: mockRefreshToken.token,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: mockRefreshToken.expiresAt,
      };

      const createdToken = {
        ...mockRefreshToken,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      prismaService.refreshToken.create.mockResolvedValue(createdToken);

      const result = await repository.create(createData);

      expect(result.ipAddress).toBe('192.168.1.1');
      expect(result.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('update', () => {
    it('should update token fields', async () => {
      const updateData = {
        revokedAt: new Date(),
      };

      const updatedToken = {
        ...mockRefreshToken,
        ...updateData,
      };

      prismaService.refreshToken.update.mockResolvedValue(updatedToken);

      const result = await repository.update(
        { id: mockRefreshToken.id },
        updateData,
      );

      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: updateData,
      });
      expect(result).toEqual(updatedToken);
    });

    it('should revoke token', async () => {
      const revokedAt = new Date();
      const updateData = {
        revokedAt,
      };

      const updatedToken = {
        ...mockRefreshToken,
        revokedAt,
      };

      prismaService.refreshToken.update.mockResolvedValue(updatedToken);

      const result = await repository.update(
        { id: mockRefreshToken.id },
        updateData,
      );

      expect(result.revokedAt).toEqual(revokedAt);
    });

    it('should set replaced by token ID', async () => {
      const updateData = {
        replacedByTokenId: 'new-token-id',
      };

      const updatedToken = {
        ...mockRefreshToken,
        ...updateData,
      };

      prismaService.refreshToken.update.mockResolvedValue(updatedToken);

      const result = await repository.update(
        { id: mockRefreshToken.id },
        updateData,
      );

      expect(result.replacedByTokenId).toBe('new-token-id');
    });

    it('should update both revokedAt and replacedByTokenId', async () => {
      const updateData = {
        revokedAt: new Date(),
        replacedByTokenId: 'new-token-id',
      };

      const updatedToken = {
        ...mockRefreshToken,
        ...updateData,
      };

      prismaService.refreshToken.update.mockResolvedValue(updatedToken);

      const result = await repository.update(
        { id: mockRefreshToken.id },
        updateData,
      );

      expect(result.revokedAt).toBeDefined();
      expect(result.replacedByTokenId).toBe('new-token-id');
    });
  });

  describe('updateMany', () => {
    it('should update multiple tokens', async () => {
      const updateResult = { count: 3 };
      const updateData = {
        revokedAt: new Date(),
      };

      prismaService.refreshToken.updateMany.mockResolvedValue(updateResult);

      const where = { userId: mockRefreshToken.userId };
      const result = await repository.updateMany(where, updateData);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where,
        data: updateData,
      });
      expect(result).toEqual(updateResult);
    });

    it('should revoke all user tokens', async () => {
      const revokedAt = new Date();
      const updateResult = { count: 5 };
      const updateData = {
        revokedAt,
      };

      prismaService.refreshToken.updateMany.mockResolvedValue(updateResult);

      const where = { userId: mockRefreshToken.userId };
      const result = await repository.updateMany(where, updateData);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where,
        data: updateData,
      });
      expect(result.count).toBe(5);
    });

    it('should handle user with no tokens', async () => {
      const updateResult = { count: 0 };
      const updateData = {
        revokedAt: new Date(),
      };

      prismaService.refreshToken.updateMany.mockResolvedValue(updateResult);

      const where = { userId: 'user-with-no-tokens' };
      const result = await repository.updateMany(where, updateData);

      expect(result.count).toBe(0);
    });

    it('should apply filters correctly', async () => {
      const updateResult = { count: 2 };
      const updateData = {
        revokedAt: new Date(),
      };

      prismaService.refreshToken.updateMany.mockResolvedValue(updateResult);

      const where = {
        userId: mockRefreshToken.userId,
        revokedAt: null,
      };
      const result = await repository.updateMany(where, updateData);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where,
        data: updateData,
      });
      expect(result.count).toBe(2);
    });
  });
});
