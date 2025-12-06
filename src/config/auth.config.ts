import Joi from 'joi';
import { StringValue } from 'ms';

export interface AuthConfig {
  jwtAccessSecret: string;
  jwtAccessExpiresIn: StringValue;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: StringValue;
  activationLinkExpiresIn: string;
}

export const authConfigSchema = Joi.object<AuthConfig>({
  jwtAccessSecret: Joi.string().required(),
  jwtAccessExpiresIn: Joi.string().default('1h'),
  jwtRefreshSecret: Joi.string().required(),
  jwtRefreshExpiresIn: Joi.string().default('30d'),
  activationLinkExpiresIn: Joi.string().default('24h'),
});
