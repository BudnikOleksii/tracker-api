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
      const regex = this.buildRegexFromPattern(prefixedPattern);
      const cacheManagerWithStores = this.cacheManager as unknown as {
        stores?: unknown[];
      };

      if (!cacheManagerWithStores.stores) {
        this.logger.warn('Pattern-based deletion not supported by cache store');

        return;
      }

      for (const store of cacheManagerWithStores.stores) {
        const matchingKeys = await this.collectKeysForStore(
          store,
          prefixedPattern,
          regex,
        );

        if (!matchingKeys.length) {
          continue;
        }

        const chunkSize = 100;

        for (let index = 0; index < matchingKeys.length; index += chunkSize) {
          const chunk = matchingKeys.slice(index, index + chunkSize);

          await Promise.all(chunk.map((key) => this.cacheManager.del(key)));
        }
      }
    } catch (error) {
      this.logger.error(
        `Cache pattern delete error for pattern ${pattern}:`,
        error,
      );
    }
  }

  private async collectKeysForStore(
    store: unknown,
    pattern: string,
    regex: RegExp,
  ): Promise<string[]> {
    if (this.isIterableStore(store)) {
      return this.collectKeysFromIterator(store, regex);
    }

    const redisClient = this.getRedisClientFromStore(store);

    if (redisClient) {
      return this.collectKeysFromRedisClient(redisClient, pattern, regex);
    }

    this.logger.warn('Pattern-based deletion not supported by cache store');

    return [];
  }

  private isIterableStore(store: unknown): store is {
    iterator?: () => AsyncIterable<string> | Iterable<string>;
    iterate?: () => AsyncIterable<string> | Iterable<string>;
  } {
    if (!store) {
      return false;
    }

    const candidate = store as {
      iterator?: () => AsyncIterable<string> | Iterable<string>;
      iterate?: () => AsyncIterable<string> | Iterable<string>;
    };

    return (
      typeof candidate.iterator === 'function' ||
      typeof candidate.iterate === 'function'
    );
  }

  private async collectKeysFromIterator(
    store: {
      iterator?: () => AsyncIterable<string> | Iterable<string>;
      iterate?: () => AsyncIterable<string> | Iterable<string>;
    },
    regex: RegExp,
  ): Promise<string[]> {
    const iteratorFn = store.iterator ?? store.iterate;

    if (!iteratorFn) {
      return [];
    }

    const collectedKeys: string[] = [];

    for await (const item of iteratorFn.call(store) as
      | AsyncIterable<unknown>
      | Iterable<unknown>) {
      if (typeof item === 'string' && regex.test(item)) {
        collectedKeys.push(item);
      }
    }

    return collectedKeys;
  }

  private getRedisClientFromStore(store: unknown): {
    scan?: (
      cursor: string,
      match: string,
      count: number,
    ) => Promise<[string, string[]]> | [string, string[]];
    scanIterator?: (match: string) => AsyncIterable<string> | Iterable<string>;
  } | null {
    if (!store) {
      return null;
    }

    const candidate = store as {
      getClient?: () =>
        | {
            scan?: (
              cursor: string,
              match: string,
              count: number,
            ) => Promise<[string, string[]]> | [string, string[]];
            scanIterator?: (
              match: string,
            ) => AsyncIterable<string> | Iterable<string>;
          }
        | undefined;
      getRedisClient?: () =>
        | {
            scan?: (
              cursor: string,
              match: string,
              count: number,
            ) => Promise<[string, string[]]> | [string, string[]];
            scanIterator?: (
              match: string,
            ) => AsyncIterable<string> | Iterable<string>;
          }
        | undefined;
    };

    if (typeof candidate.getClient === 'function') {
      const client = candidate.getClient();

      if (client) {
        return client;
      }
    }

    if (typeof candidate.getRedisClient === 'function') {
      const client = candidate.getRedisClient();

      if (client) {
        return client;
      }
    }

    return null;
  }

  private async collectKeysFromRedisClient(
    client: {
      scan?: (
        cursor: string,
        match: string,
        count: number,
      ) => Promise<[string, string[]]> | [string, string[]];
      scanIterator?: (
        match: string,
      ) => AsyncIterable<string> | Iterable<string>;
    },
    pattern: string,
    regex: RegExp,
  ): Promise<string[]> {
    const collectedKeys: string[] = [];

    if (client.scanIterator) {
      const iterable = client.scanIterator(pattern);

      for await (const key of iterable as
        | AsyncIterable<unknown>
        | Iterable<unknown>) {
        if (typeof key === 'string' && regex.test(key)) {
          collectedKeys.push(key);
        }
      }

      return collectedKeys;
    }

    if (!client.scan) {
      return collectedKeys;
    }

    let cursor = '0';

    do {
      const result = await Promise.resolve(client.scan(cursor, pattern, 100));

      const nextCursor = result[0];
      const batchKeys = result[1];

      for (const key of batchKeys) {
        if (regex.test(key)) {
          collectedKeys.push(key);
        }
      }

      cursor = nextCursor;
    } while (cursor !== '0');

    return collectedKeys;
  }

  private buildRegexFromPattern(pattern: string): RegExp {
    let regexPattern = '^';
    let index = 0;

    while (index < pattern.length) {
      const char = pattern.charAt(index);

      if (char === '\\') {
        const nextChar = pattern.charAt(index + 1);

        if (nextChar === undefined) {
          regexPattern += '\\\\';
          index += 1;
        } else {
          regexPattern += this.escapeRegexChar(nextChar);
          index += 2;
        }
      } else if (char === '*') {
        regexPattern += '.*';
        index += 1;
      } else {
        regexPattern += this.escapeRegexChar(char);
        index += 1;
      }
    }

    regexPattern += '$';

    return new RegExp(regexPattern);
  }

  private escapeRegexChar(char: string): string {
    const specials = '.+?[]^$(){}|\\';

    if (specials.includes(char)) {
      return `\\${char}`;
    }

    return char;
  }

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
