import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { SharedModule } from '../shared/shared.module';
import { UsersModule } from '../users/users.module';
import { AppConfigService } from '../config/app-config.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.auth.jwtAccessSecret,
        signOptions: {
          expiresIn: configService.auth.jwtAccessExpiresIn,
        },
      }),
    }),
    SharedModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    RefreshTokensRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
