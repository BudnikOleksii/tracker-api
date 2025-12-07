import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  accessToken!: string;
  user!: UserResponseDto;
}

export type AuthResponseWithRefreshTokenDto = AuthResponseDto & {
  refreshToken: string;
};

export type RefreshTokenResponseDto = Omit<AuthResponseDto, 'user'> & {
  refreshToken: string;
};
