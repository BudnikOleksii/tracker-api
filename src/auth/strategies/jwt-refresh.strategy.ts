import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

import { AppConfigService } from '../../config/app-config.service';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';

export interface JwtRefreshPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: AppConfigService,
    private refreshTokensRepository: RefreshTokensRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          return (request?.cookies?.refreshToken as string | undefined) || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, _payload: JwtRefreshPayload) {
    const refreshToken = request?.cookies?.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const tokenRecord = await this.refreshTokensRepository.findUniqueWithUser({
      token: refreshToken,
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (tokenRecord.replacedByTokenId) {
      throw new UnauthorizedException('Refresh token has been replaced');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (tokenRecord.user.deletedAt) {
      throw new UnauthorizedException('User has been deleted');
    }

    return {
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id,
      user: tokenRecord.user,
    };
  }
}
