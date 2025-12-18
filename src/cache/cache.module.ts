import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CacheService } from './cache.service';
import { CacheConfig } from '../config/cache.config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const cacheConfig = configService.get<CacheConfig>('cache');

        if (!cacheConfig) {
          throw new Error('Cache configuration is missing');
        }

        const store = await redisStore({
          socket: {
            host: cacheConfig.host,
            port: cacheConfig.port,
          },
          password: cacheConfig.password,
          database: cacheConfig.db,
        });

        return {
          store: () => store,
          ttl: cacheConfig.ttl * 1000,
          max: cacheConfig.max,
        };
      },
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
