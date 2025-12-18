import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user!: UserResponseDto;
}

export type AuthResponseWithRefreshTokenDto = AuthResponseDto & {
  refreshToken: string;
};

export type RefreshTokenResponseDto = Omit<AuthResponseDto, 'user'> & {
  refreshToken: string;
};
