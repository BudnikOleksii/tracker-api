import { registerAs } from '@nestjs/config';

import { CacheConfig, cacheConfigSchema } from './cache.config';

export default registerAs('cache', (): CacheConfig => {
  const configValues: Partial<CacheConfig> = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
      ? parseInt(process.env.REDIS_PORT, 10)
      : undefined,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : undefined,
    ttl: process.env.CACHE_TTL
      ? parseInt(process.env.CACHE_TTL, 10)
      : undefined,
    max: process.env.CACHE_MAX
      ? parseInt(process.env.CACHE_MAX, 10)
      : undefined,
    keyPrefix: process.env.CACHE_KEY_PREFIX,
  };

  const validationResult = cacheConfigSchema.validate(configValues, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (validationResult.error) {
    throw new Error(
      `Cache configuration validation failed: ${validationResult.error.details
        .map((detail) => detail.message)
        .join(', ')}`,
    );
  }

  return validationResult.value;
});
