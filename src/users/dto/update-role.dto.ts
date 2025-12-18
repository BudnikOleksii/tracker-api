import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../../generated/prisma/enums';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
