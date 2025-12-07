import Joi from 'joi';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export const emailConfigSchema = Joi.object<EmailConfig>({
  host: Joi.string().required(),
  port: Joi.number().port().required(),
  user: Joi.string().required(),
  pass: Joi.string().required(),
  from: Joi.string().email().required(),
});

