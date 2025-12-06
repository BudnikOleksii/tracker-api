import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AppConfigService } from '../../config/app-config.service';
import { UsersRepository } from '../../users/repositories/users.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: AppConfigService,
    private usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.auth.jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersRepository.findUnique({
      id: payload.sub,
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found or deleted');
    }

    return user;
  }
}
