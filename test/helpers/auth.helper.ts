import { randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { User } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppConfigService } from '../../src/config/app-config.service';
import { RefreshTokensRepository } from '../../src/auth/repositories/refresh-tokens.repository';

export class AuthHelper {
  private jwtService: JwtService;
  private refreshTokensRepository: RefreshTokensRepository;

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService,
  ) {
    this.jwtService = new JwtService({
      secret: configService.auth.jwtAccessSecret,
    });
    this.refreshTokensRepository = new RefreshTokensRepository(prisma);
  }

  async generateTestAccessToken(
    userId: string,
    email: string,
    role: UserRole = UserRole.USER,
  ): Promise<string> {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.auth.jwtAccessSecret,
      expiresIn: this.configService.auth.jwtAccessExpiresIn,
    });
  }

  async generateTestRefreshToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      tokenId: randomUUID(),
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.auth.jwtRefreshSecret,
      expiresIn: this.configService.auth.jwtRefreshExpiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.refreshTokensRepository.create({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  async createTestUser(overrides?: Partial<User>): Promise<User> {
    const defaultUser = {
      email: `test-${Date.now()}@example.com`,
      passwordHash: '$2b$10$dummyHashForTesting',
      emailVerified: true,
      role: UserRole.USER,
      ...overrides,
    };

    return this.prisma.user.create({
      data: defaultUser,
    });
  }

  authenticateRequest(
    request: { set: (key: string, value: string) => void },
    token: string,
  ): void {
    request.set('Authorization', `Bearer ${token}`);
  }
}
