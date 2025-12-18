import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UsersRepository } from '../users/repositories/users.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { EmailService } from '../shared/services/email.service';
import { AppConfigService } from '../config/app-config.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../generated/prisma/enums';
import { User } from '../../generated/prisma/client';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let refreshTokensRepository: {
    findUnique: jest.Mock;
    findUniqueWithUser: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let emailService: {
    sendVerificationEmail: jest.Mock;
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
    const mockUsersRepository = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockRefreshTokensRepository = {
      findUnique: jest.fn(),
      findUniqueWithUser: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
    };

    const mockConfigService = {
      auth: {
        jwtAccessSecret: 'access-secret',
        jwtAccessExpiresIn: '15m',
        jwtRefreshSecret: 'refresh-secret',
        jwtRefreshExpiresIn: '7d',
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: RefreshTokensRepository,
          useValue: mockRefreshTokensRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    refreshTokensRepository = module.get(RefreshTokensRepository);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      countryCode: CountryCode.US,
      baseCurrencyCode: CurrencyCode.USD,
    };

    it('should successfully register new user', async () => {
      usersRepository.findUnique.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(
        registerDto,
        '127.0.0.1',
        'user-agent',
      );

      expect(usersRepository.findUnique).toHaveBeenCalledWith({
        email: registerDto.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', registerDto.email);
    });

    it('should throw ConflictException when email already exists', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
      );
    });

    it('should hash password correctly', async () => {
      usersRepository.findUnique.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('should generate verification token', async () => {
      usersRepository.findUnique.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.register(registerDto);

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          emailVerificationToken: expect.any(String),
          emailVerificationTokenExpiresAt: expect.any(Date),
        }),
      );
    });

    it('should set token expiration to 24 hours', async () => {
      usersRepository.findUnique.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const before = new Date();
      await service.register(registerDto);

      const callArgs = usersRepository.create.mock.calls[0]?.[0] as {
        emailVerificationTokenExpiresAt: Date;
      };
      const expiresAt = callArgs.emailVerificationTokenExpiresAt;
      const hoursDiff =
        (expiresAt.getTime() - before.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeGreaterThanOrEqual(23.9);
      expect(hoursDiff).toBeLessThanOrEqual(24.1);
    });

    it('should send verification email', async () => {
      usersRepository.findUnique.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      await service.register(registerDto);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerDto.email,
        expect.any(String),
      );
    });

    it('should return UserResponseDto', async () => {
      usersRepository.findUnique.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should handle soft-deleted users', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      usersRepository.findUnique.mockResolvedValue(deletedUser);
      usersRepository.create.mockResolvedValue(mockUser);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(usersRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('verifyEmail', () => {
    const validToken = 'valid-token';
    const expiredToken = 'expired-token';
    const invalidToken = 'invalid-token';

    it('should successfully verify email with valid token', async () => {
      const userWithToken = {
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: validToken,
        emailVerificationTokenExpiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ),
      };

      usersRepository.findFirst.mockResolvedValue(userWithToken);
      usersRepository.update.mockResolvedValue({
        ...userWithToken,
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      });

      const result = await service.verifyEmail(validToken);

      expect(usersRepository.findFirst).toHaveBeenCalledWith({
        emailVerificationToken: validToken,
        emailVerificationTokenExpiresAt: {
          gte: expect.any(Date),
        },
      });
      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: userWithToken.id },
        {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      );
      expect(result).toEqual({ message: 'Email verified successfully' });
    });

    it('should throw BadRequestException for invalid token', async () => {
      usersRepository.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail(invalidToken)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.verifyEmail(invalidToken)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_VERIFICATION_TOKEN,
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      usersRepository.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail(expiredToken)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update user emailVerified flag', async () => {
      const userWithToken = {
        ...mockUser,
        emailVerified: false,
        emailVerificationToken: validToken,
        emailVerificationTokenExpiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ),
      };

      usersRepository.findFirst.mockResolvedValue(userWithToken);
      usersRepository.update.mockResolvedValue({
        ...userWithToken,
        emailVerified: true,
      });

      await service.verifyEmail(validToken);

      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: userWithToken.id },
        {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      );
    });

    it('should clear verification token fields', async () => {
      const userWithToken = {
        ...mockUser,
        emailVerificationToken: validToken,
        emailVerificationTokenExpiresAt: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ),
      };

      usersRepository.findFirst.mockResolvedValue(userWithToken);
      usersRepository.update.mockResolvedValue({
        ...userWithToken,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      });

      await service.verifyEmail(validToken);

      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: userWithToken.id },
        {
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiresAt: null,
        },
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('access-token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.login(loginDto, '127.0.0.1', 'user-agent');

      expect(usersRepository.findUnique).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(refreshTokensRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      usersRepository.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      usersRepository.findUnique.mockResolvedValue(deletedUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_CREDENTIALS,
      );
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      usersRepository.findUnique.mockResolvedValue(unverifiedUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
      );
    });

    it('should generate access and refresh tokens', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.login(loginDto, '127.0.0.1', 'user-agent');

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should create refresh token record', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.login(loginDto, '127.0.0.1', 'user-agent');

      expect(refreshTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          deviceInfo: expect.any(String),
          ipAddress: '127.0.0.1',
          userAgent: 'user-agent',
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should return AuthResponseWithRefreshTokenDto', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'token-id',
        userId: mockUser.id,
        token: 'refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('should handle user without passwordHash', async () => {
      const userWithoutPassword = { ...mockUser, passwordHash: null };
      usersRepository.findUnique.mockResolvedValue(userWithoutPassword);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    const refreshToken = 'valid-refresh-token';

    it('should successfully refresh tokens with valid refresh token', async () => {
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(tokenRecord);
      jwtService.signAsync.mockResolvedValue('new-token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'new-token-id',
        userId: mockUser.id,
        token: 'new-refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      refreshTokensRepository.update.mockResolvedValue(tokenRecord);

      const result = await service.refreshTokens(
        refreshToken,
        '127.0.0.1',
        'user-agent',
      );

      expect(refreshTokensRepository.findUniqueWithUser).toHaveBeenCalledWith({
        token: refreshToken,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(refreshTokensRepository.create).toHaveBeenCalled();
      expect(refreshTokensRepository.update).toHaveBeenCalledWith(
        { id: tokenRecord.id },
        { replacedByTokenId: expect.any(String) },
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        ERROR_MESSAGES.INVALID_REFRESH_TOKEN,
      );
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      const revokedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(),
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(
        revokedToken,
      );

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        ERROR_MESSAGES.REFRESH_TOKEN_REVOKED,
      );
    });

    it('should throw UnauthorizedException for replaced token', async () => {
      const replacedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedByTokenId: 'new-token-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(
        replacedToken,
      );

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      const expiredToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() - 1000),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(
        expiredToken,
      );

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: deletedUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(tokenRecord);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should generate new access and refresh tokens', async () => {
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(tokenRecord);
      jwtService.signAsync.mockResolvedValue('new-token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'new-token-id',
        userId: mockUser.id,
        token: 'new-refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      refreshTokensRepository.update.mockResolvedValue(tokenRecord);

      await service.refreshTokens(refreshToken);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    it('should mark old token as replaced', async () => {
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(tokenRecord);
      jwtService.signAsync.mockResolvedValue('new-token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'new-token-id',
        userId: mockUser.id,
        token: 'new-refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      refreshTokensRepository.update.mockResolvedValue(tokenRecord);

      await service.refreshTokens(refreshToken);

      expect(refreshTokensRepository.update).toHaveBeenCalledWith(
        { id: tokenRecord.id },
        { replacedByTokenId: 'new-token-id' },
      );
    });

    it('should create new refresh token record', async () => {
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
      };

      refreshTokensRepository.findUniqueWithUser.mockResolvedValue(tokenRecord);
      jwtService.signAsync.mockResolvedValue('new-token');
      refreshTokensRepository.create.mockResolvedValue({
        id: 'new-token-id',
        userId: mockUser.id,
        token: 'new-refresh-token',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      refreshTokensRepository.update.mockResolvedValue(tokenRecord);

      await service.refreshTokens(refreshToken, '127.0.0.1', 'user-agent');

      expect(refreshTokensRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          token: expect.any(String),
          deviceInfo: expect.any(String),
          ipAddress: '127.0.0.1',
          userAgent: 'user-agent',
          expiresAt: expect.any(Date),
        }),
      );
    });
  });

  describe('logout', () => {
    const refreshToken = 'valid-refresh-token';

    it('should successfully logout with valid refresh token', async () => {
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      refreshTokensRepository.findUnique.mockResolvedValue(tokenRecord);
      refreshTokensRepository.update.mockResolvedValue({
        ...tokenRecord,
        revokedAt: new Date(),
      });

      const result = await service.logout(refreshToken);

      expect(refreshTokensRepository.findUnique).toHaveBeenCalledWith({
        token: refreshToken,
      });
      expect(refreshTokensRepository.update).toHaveBeenCalledWith(
        { id: tokenRecord.id },
        { revokedAt: expect.any(Date) },
      );
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should revoke refresh token', async () => {
      const tokenRecord = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: null,
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      refreshTokensRepository.findUnique.mockResolvedValue(tokenRecord);
      refreshTokensRepository.update.mockResolvedValue({
        ...tokenRecord,
        revokedAt: new Date(),
      });

      await service.logout(refreshToken);

      expect(refreshTokensRepository.update).toHaveBeenCalledWith(
        { id: tokenRecord.id },
        { revokedAt: expect.any(Date) },
      );
    });

    it('should handle non-existent token gracefully', async () => {
      refreshTokensRepository.findUnique.mockResolvedValue(null);

      const result = await service.logout(refreshToken);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(refreshTokensRepository.update).not.toHaveBeenCalled();
    });

    it('should handle already revoked token', async () => {
      const revokedToken = {
        id: 'token-id',
        userId: mockUser.id,
        token: refreshToken,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'user-agent',
        expiresAt: new Date(),
        revokedAt: new Date(),
        replacedByTokenId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      refreshTokensRepository.findUnique.mockResolvedValue(revokedToken);

      const result = await service.logout(refreshToken);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(refreshTokensRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should successfully logout from all devices', async () => {
      refreshTokensRepository.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.logoutAll(mockUser.id);

      expect(refreshTokensRepository.updateMany).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          revokedAt: null,
        },
        {
          revokedAt: expect.any(Date),
        },
      );
      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
      });
    });

    it("should revoke all user's refresh tokens", async () => {
      refreshTokensRepository.updateMany.mockResolvedValue({ count: 3 });

      await service.logoutAll(mockUser.id);

      expect(refreshTokensRepository.updateMany).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          revokedAt: null,
        },
        {
          revokedAt: expect.any(Date),
        },
      );
    });

    it('should handle user with no tokens', async () => {
      refreshTokensRepository.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.logoutAll(mockUser.id);

      expect(result).toEqual({
        message: 'Logged out from all devices successfully',
      });
    });
  });
});
