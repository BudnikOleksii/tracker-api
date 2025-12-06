import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfigFactory from './config/app.config.factory';
import databaseConfigFactory from './config/database.config.factory';
import authConfigFactory from './config/auth.config.factory';
import { AppConfigService } from './config/app-config.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfigFactory, databaseConfigFactory, authConfigFactory],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppConfigService],
})
export class AppModule {}
