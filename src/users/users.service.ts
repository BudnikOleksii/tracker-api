import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { UsersRepository } from './repositories/users.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from '../../generated/prisma/enums';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findUnique({ id });

    if (!user || user.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const { deletedAt: _deletedAt, ...userData } = user;

    return userData as UserResponseDto;
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findUnique({ email });

    if (!user || user.deletedAt) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const { deletedAt: _deletedAt, ...userData } = user;

    return userData as UserResponseDto;
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

    return updatedUser as UserResponseDto;
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

    return updatedUser as UserResponseDto;
  }
}
