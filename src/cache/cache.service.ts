import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

import { CacheConfig } from '../config/cache.config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly keyPrefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    const cacheConfig = this.configService.get<CacheConfig>('cache');
    this.keyPrefix = cacheConfig?.keyPrefix || 'tracker:';
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const prefixedKey = this.prefixKey(key);
      const value = await this.cacheManager.get<T>(prefixedKey);

      return value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);

      return undefined;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key);
      const ttlInMs = ttl ? ttl * 1000 : undefined;
      await this.cacheManager.set(prefixedKey, value, ttlInMs);
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      const prefixedKey = this.prefixKey(key);
      await this.cacheManager.del(prefixedKey);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const prefixedPattern = this.prefixKey(pattern);
      const cacheManagerUnknown = this.cacheManager as unknown as {
        stores?: {
          opts?: { namespace?: string };
          keys?: () => Promise<string[]>;
        }[];
      };

      if (
        cacheManagerUnknown.stores &&
        Array.isArray(cacheManagerUnknown.stores)
      ) {
        for (const store of cacheManagerUnknown.stores) {
          if (store && typeof store.opts?.namespace === 'string') {
            const keys = await this.getKeysByPattern(store, prefixedPattern);
            if (keys && keys.length > 0) {
              await Promise.all(
                keys.map((key: string) => this.cacheManager.del(key)),
              );
            }
          }
        }
      } else {
        this.logger.warn('Pattern-based deletion not supported by cache store');
      }
    } catch (error) {
      this.logger.error(
        `Cache pattern delete error for pattern ${pattern}:`,
        error,
      );
    }
  }

  private async getKeysByPattern(
    store: { keys?: () => Promise<string[]> },
    pattern: string,
  ): Promise<string[]> {
    if (store && typeof store.keys === 'function') {
      try {
        const allKeys = await store.keys();
        if (Array.isArray(allKeys)) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));

          return allKeys.filter((key: string) => regex.test(key));
        }
      } catch (error) {
        this.logger.warn('Error getting keys from store:', error);
      }
    }

    return [];
  }

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
