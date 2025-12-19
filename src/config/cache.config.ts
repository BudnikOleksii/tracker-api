import Joi from 'joi';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
  max?: number;
  keyPrefix: string;
}

export const cacheConfigSchema = Joi.object<CacheConfig>({
  host: Joi.string().default('localhost'),
  port: Joi.number().port().default(6379),
  password: Joi.string().optional(),
  db: Joi.number().integer().min(0).max(15).default(0),
  ttl: Joi.number().integer().min(1).default(3600),
  max: Joi.number().integer().min(1).optional(),
  keyPrefix: Joi.string().default('tracker:'),
});
