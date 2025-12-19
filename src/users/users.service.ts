import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UsersRepository } from './repositories/users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';
import { CacheService } from '../cache/cache.service';
import { CacheKeyUtil } from '../cache/utils/cache-key.util';
import { CacheInvalidationUtil } from '../cache/utils/cache-invalidation.util';

const USER_CACHE_TTL = 900;

@Injectable()
export class UsersService {
  private cacheInvalidation: CacheInvalidationUtil;

  constructor(
    private usersRepository: UsersRepository,
    private cacheService: CacheService,
  ) {
    this.cacheInvalidation = new CacheInvalidationUtil(cacheService);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const cacheKey = CacheKeyUtil.userProfile(id);
    const cached = await this.cacheService.get<UserResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.usersRepository.findUnique({ id });

    if (!user || user.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const result = this.mapUserToDto(user);
    await this.cacheService.set(cacheKey, result, USER_CACHE_TTL);

    return result;
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findUnique({ email });

    if (!user || user.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return this.mapUserToDto(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findUnique({ id: userId });

    if (!user || user.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const updatedUser = await this.usersRepository.update(
      { id: userId },
      {
        countryCode: dto.countryCode,
        baseCurrencyCode: dto.baseCurrencyCode,
      },
    );

    await this.cacheInvalidation.invalidateUserProfile(userId);

    return this.mapUserToDto(updatedUser);
  }

  async updateRole(
    userId: string,
    newRole: UserRole,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.findUnique({ id: userId });

    if (!user || user.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (
      user.role === UserRole.SUPER_ADMIN &&
      newRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException('Cannot demote super admin');
    }

    const updatedUser = await this.usersRepository.update(
      { id: userId },
      { role: newRole },
    );

    await this.cacheInvalidation.invalidateUserProfile(userId);

    return this.mapUserToDto(updatedUser);
  }

  private mapUserToDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
