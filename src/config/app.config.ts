import Joi from 'joi';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export interface AppConfig {
  nodeEnv: Environment;
  port: number;
  host: string;
  allowedOrigins: string[];
  swaggerPath: string;
  globalPrefix: string;
  apiVersion: string;
}

export const appConfigSchema = Joi.object<AppConfig>({
  nodeEnv: Joi.string()
    .valid(...Object.values(Environment))
    .default(Environment.Development),
  port: Joi.number().port().default(3000),
  host: Joi.string().default('localhost'),
  allowedOrigins: Joi.array().items(Joi.string()),
  swaggerPath: Joi.string().default('/api/docs'),
  globalPrefix: Joi.string().default('api'),
  apiVersion: Joi.string().default('1'),
});
