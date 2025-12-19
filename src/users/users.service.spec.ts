import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { UsersService } from './users.service';
import { CacheService } from '../cache/cache.service';
import { UsersRepository } from './repositories/users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../generated/prisma/enums';
import { User } from '../../generated/prisma/client';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';

import Mocked = jest.Mocked;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Mocked<UsersRepository>;

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
      update: jest.fn(),
    };

    const mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should successfully find user by ID', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(usersRepository.findUnique).toHaveBeenCalledWith({
        id: mockUser.id,
      });
      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersRepository.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('non-existent-id')).rejects.toThrow(
        ERROR_MESSAGES.USER_NOT_FOUND,
      );
    });

    it('should throw NotFoundException for deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      usersRepository.findUnique.mockResolvedValue(deletedUser);

      await expect(service.findById(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return UserResponseDto', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
    });
  });

  describe('findByEmail', () => {
    it('should successfully find user by email', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(mockUser.email);

      expect(usersRepository.findUnique).toHaveBeenCalledWith({
        email: mockUser.email,
      });
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.findByEmail('nonexistent@example.com'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      usersRepository.findUnique.mockResolvedValue(deletedUser);

      await expect(service.findByEmail(mockUser.email)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto: UpdateUserDto = {
      countryCode: CountryCode.CA,
      baseCurrencyCode: CurrencyCode.CAD,
    };

    it('should successfully update own profile', async () => {
      const updatedUser = {
        ...mockUser,
        countryCode: updateDto.countryCode,
        baseCurrencyCode: updateDto.baseCurrencyCode,
      };
      usersRepository.findUnique.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(mockUser.id, updateDto);

      expect(usersRepository.findUnique).toHaveBeenCalledWith({
        id: mockUser.id,
      });
      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        updateDto,
      );
      expect(result).toHaveProperty('countryCode', updateDto.countryCode);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('should successfully update user role (admin only)', async () => {
      const updatedUser = { ...mockUser, role: UserRole.ADMIN };
      usersRepository.findUnique.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.updateRole(mockUser.id, UserRole.ADMIN);

      expect(usersRepository.findUnique).toHaveBeenCalledWith({
        id: mockUser.id,
      });
      expect(usersRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        { role: UserRole.ADMIN },
      );
      expect(result).toHaveProperty('role', UserRole.ADMIN);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      usersRepository.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('non-existent-id', UserRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate role value', async () => {
      usersRepository.findUnique.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue({
        ...mockUser,
        role: UserRole.ADMIN,
      });

      const result = await service.updateRole(mockUser.id, UserRole.ADMIN);

      expect(result).toHaveProperty('role', UserRole.ADMIN);
    });

    it('should prevent demoting super admin', async () => {
      const superAdmin = { ...mockUser, role: UserRole.SUPER_ADMIN };
      usersRepository.findUnique.mockResolvedValue(superAdmin);

      await expect(
        service.updateRole(superAdmin.id, UserRole.ADMIN),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.updateRole(superAdmin.id, UserRole.ADMIN),
      ).rejects.toThrow('Cannot demote super admin');
    });

    it('should allow keeping super admin role', async () => {
      const superAdmin = { ...mockUser, role: UserRole.SUPER_ADMIN };
      usersRepository.findUnique.mockResolvedValue(superAdmin);
      usersRepository.update.mockResolvedValue(superAdmin);

      const result = await service.updateRole(
        superAdmin.id,
        UserRole.SUPER_ADMIN,
      );

      expect(result).toHaveProperty('role', UserRole.SUPER_ADMIN);
    });
  });
});
