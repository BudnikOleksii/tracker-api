import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';

import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppConfigService } from '../../src/config/app-config.service';
import { RefreshTokensRepository } from '../../src/auth/repositories/refresh-tokens.repository';
import { AuthHelper } from './auth.helper';

jest.mock('@nestjs/jwt');
jest.mock('../../src/auth/repositories/refresh-tokens.repository');

describe('AuthHelper', () => {
  let authHelper: AuthHelper;
  let mockPrismaService: PrismaService;
  let mockConfigService: AppConfigService;
  let mockJwtService: {
    signAsync: jest.Mock;
  };
  let mockRefreshTokensRepository: {
    create: jest.Mock;
  };

  beforeEach(() => {
    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockRefreshTokensRepository = {
      create: jest.fn().mockResolvedValue({}),
    };

    mockPrismaService = {
      user: {
        create: jest.fn(),
      },
    } as unknown as PrismaService;

    mockConfigService = {
      auth: {
        jwtAccessSecret: 'test-access-secret',
        jwtRefreshSecret: 'test-refresh-secret',
        jwtAccessExpiresIn: '15m',
        jwtRefreshExpiresIn: '30d',
      },
    } as unknown as AppConfigService;

    (JwtService as jest.Mock).mockImplementation(() => mockJwtService);
    (RefreshTokensRepository as jest.Mock).mockImplementation(
      () => mockRefreshTokensRepository,
    );

    authHelper = new AuthHelper(mockPrismaService, mockConfigService);
  });

  describe('generateTestAccessToken', () => {
    it('should generate access token with correct payload', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = UserRole.USER;
      const expectedToken = 'test-access-token';

      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await authHelper.generateTestAccessToken(
        userId,
        email,
        role,
      );

      expect(result).toBe(expectedToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: mockConfigService.auth.jwtAccessSecret,
          expiresIn: mockConfigService.auth.jwtAccessExpiresIn,
        },
      );
    });

    it('should use default USER role when not provided', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const expectedToken = 'test-access-token';

      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      await authHelper.generateTestAccessToken(userId, email);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          role: UserRole.USER,
        },
        expect.any(Object),
      );
    });

    it('should generate token with ADMIN role', async () => {
      const userId = 'user-123';
      const email = 'admin@example.com';
      const role = UserRole.ADMIN;
      const expectedToken = 'test-access-token';

      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      await authHelper.generateTestAccessToken(userId, email, role);

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: userId,
          email,
          role: UserRole.ADMIN,
        },
        expect.any(Object),
      );
    });
  });

  describe('generateTestRefreshToken', () => {
    it('should generate refresh token and create record', async () => {
      const userId = 'user-123';
      const expectedToken = 'test-refresh-token';

      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await authHelper.generateTestRefreshToken(userId);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          tokenId: expect.any(String),
        }),
        {
          secret: mockConfigService.auth.jwtRefreshSecret,
          expiresIn: mockConfigService.auth.jwtRefreshExpiresIn,
        },
      );
      expect(mockRefreshTokensRepository.create).toHaveBeenCalledWith({
        userId,
        token: expectedToken,
        expiresAt: expect.any(Date),
      });
    });

    it('should set expiration date 30 days from now', async () => {
      const userId = 'user-123';
      const expectedToken = 'test-refresh-token';
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() + 30);

      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      await authHelper.generateTestRefreshToken(userId);

      const callArgs = mockRefreshTokensRepository.create.mock.calls[0][0];
      const expiresAt = callArgs.expiresAt as Date;

      expect(expiresAt.getTime()).toBeGreaterThan(beforeDate.getTime() - 1000);
      expect(expiresAt.getTime()).toBeLessThan(beforeDate.getTime() + 1000);
    });
  });

  describe('createTestUser', () => {
    it('should create user with default values', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test-1234567890@example.com',
        passwordHash: '$2b$10$dummyHashForTesting',
        emailVerified: true,
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const createSpy = jest
        .spyOn(mockPrismaService.user, 'create')
        .mockResolvedValue(
          mockUser as unknown as Awaited<
            ReturnType<typeof mockPrismaService.user.create>
          >,
        );

      const result = await authHelper.createTestUser();

      expect(result).toEqual(mockUser);
      expect(createSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: expect.stringMatching(/^test-\d+@example\.com$/),
          passwordHash: '$2b$10$dummyHashForTesting',
          emailVerified: true,
          role: UserRole.USER,
        }),
      });
    });

    it('should create user with overrides', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'custom@example.com',
        passwordHash: 'custom-hash',
        emailVerified: false,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const createSpy = jest
        .spyOn(mockPrismaService.user, 'create')
        .mockResolvedValue(
          mockUser as unknown as Awaited<
            ReturnType<typeof mockPrismaService.user.create>
          >,
        );

      const result = await authHelper.createTestUser({
        email: 'custom@example.com',
        passwordHash: 'custom-hash',
        emailVerified: false,
        role: UserRole.ADMIN,
      });

      expect(result).toEqual(mockUser);
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          email: 'custom@example.com',
          passwordHash: 'custom-hash',
          emailVerified: false,
          role: UserRole.ADMIN,
        },
      });
    });
  });

  describe('authenticateRequest', () => {
    it('should set Authorization header with Bearer token', () => {
      const mockRequest = {
        set: jest.fn(),
      };
      const token = 'test-token';

      authHelper.authenticateRequest(
        mockRequest as { set: (key: string, value: string) => void },
        token,
      );

      expect(mockRequest.set).toHaveBeenCalledWith(
        'Authorization',
        'Bearer test-token',
      );
    });

    it('should handle different token formats', () => {
      const mockRequest = {
        set: jest.fn(),
      };
      const token = 'another-token-123';

      authHelper.authenticateRequest(
        mockRequest as { set: (key: string, value: string) => void },
        token,
      );

      expect(mockRequest.set).toHaveBeenCalledWith(
        'Authorization',
        'Bearer another-token-123',
      );
    });
  });
});
