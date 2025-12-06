import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { UsersRepository } from '../users/repositories/users.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { EmailService } from '../shared/services/email.service';
import { AppConfigService } from '../config/app-config.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { ERROR_MESSAGES } from '../core/constants/error-messages.constant';
import {
  UserRole,
  CountryCode,
  CurrencyCode,
} from '../../generated/prisma/enums';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private refreshTokensRepository: RefreshTokensRepository,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: AppConfigService,
  ) {}

  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findUnique({
      email: dto.email,
    });

    if (existingUser && !existingUser.deletedAt) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const user = await this.usersRepository.create({
      email: dto.email,
      passwordHash,
      emailVerificationToken: verificationToken,
      emailVerificationTokenExpiresAt: expiresAt,
      countryCode: dto.countryCode,
      baseCurrencyCode: dto.baseCurrencyCode,
      ipAddress,
      userAgent,
    });

    await this.emailService.sendVerificationEmail(dto.email, verificationToken);

    return this.toUserResponseDto(user);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findFirst({
      emailVerificationToken: token,
      emailVerificationTokenExpiresAt: {
        gte: new Date(),
      },
    });

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_VERIFICATION_TOKEN);
    }

    await this.usersRepository.update(
      { id: user.id },
      {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiresAt: null,
      },
    );

    return { message: 'Email verified successfully' };
  }

  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findUnique({
      email: dto.email,
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    const deviceInfo = this.getDeviceInfo(userAgent);

    await this.refreshTokensRepository.create({
      userId: user.id,
      token: refreshToken,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt: new Date(
        Date.now() +
          (typeof this.configService.auth.jwtRefreshExpiresIn === 'string'
            ? this.parseExpiration(this.configService.auth.jwtRefreshExpiresIn)
            : 7 * 24 * 60 * 60 * 1000),
      ),
    });

    return {
      accessToken,
      refreshToken,
      user: this.toUserResponseDto(user),
    };
  }

  async refreshTokens(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Omit<AuthResponseDto, 'user'>> {
    const tokenRecord = await this.refreshTokensRepository.findUniqueWithUser({
      token: refreshToken,
    });

    if (!tokenRecord) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException(ERROR_MESSAGES.REFRESH_TOKEN_REVOKED);
    }

    if (tokenRecord.replacedByTokenId) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    if (tokenRecord.user.deletedAt) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const newAccessToken = await this.generateAccessToken(tokenRecord.user);
    const newRefreshToken = await this.generateRefreshToken(tokenRecord.userId);

    const deviceInfo = this.getDeviceInfo(userAgent);

    const newTokenRecord = await this.refreshTokensRepository.create({
      userId: tokenRecord.userId,
      token: newRefreshToken,
      deviceInfo,
      ipAddress,
      userAgent,
      expiresAt: new Date(
        Date.now() +
          (typeof this.configService.auth.jwtRefreshExpiresIn === 'string'
            ? this.parseExpiration(this.configService.auth.jwtRefreshExpiresIn)
            : 7 * 24 * 60 * 60 * 1000),
      ),
    });

    await this.refreshTokensRepository.update(
      { id: tokenRecord.id },
      { replacedByTokenId: newTokenRecord.id },
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    const tokenRecord = await this.refreshTokensRepository.findUnique({
      token: refreshToken,
    });

    if (tokenRecord && !tokenRecord.revokedAt) {
      await this.refreshTokensRepository.update(
        { id: tokenRecord.id },
        { revokedAt: new Date() },
      );
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.refreshTokensRepository.updateMany(
      {
        userId,
        revokedAt: null,
      },
      {
        revokedAt: new Date(),
      },
    );

    return { message: 'Logged out from all devices successfully' };
  }

  private async generateAccessToken(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.auth.jwtAccessSecret,
      expiresIn: this.configService.auth.jwtAccessExpiresIn,
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      tokenId: uuidv4(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.auth.jwtRefreshSecret,
      expiresIn: this.configService.auth.jwtRefreshExpiresIn,
    });
  }

  private toUserResponseDto(user: {
    id: string;
    email: string;
    emailVerified: boolean;
    countryCode: string | null;
    baseCurrencyCode: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      countryCode: user.countryCode as CountryCode | null,
      baseCurrencyCode: user.baseCurrencyCode as CurrencyCode | null,
      role: user.role as UserRole,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as UserResponseDto;
  }

  private getDeviceInfo(userAgent?: string): string {
    if (!userAgent) {
      return 'Unknown';
    }

    const browserMatch = userAgent.match(
      /(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/,
    );
    const osMatch = userAgent.match(
      /(Windows|Mac|Linux|Android|iOS)\s?([\d.]+)?/,
    );

    const browser = browserMatch ? browserMatch[1] : 'Unknown';
    const os = osMatch ? osMatch[1] : 'Unknown';

    return `${browser} on ${os}`;
  }

  private parseExpiration(expiration: string): number {
    const units: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2];

    return value * (units[unit] || 1000);
  }
}
