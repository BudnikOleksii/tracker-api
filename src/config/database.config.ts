import Joi from 'joi';

export interface DatabaseConfig {
  url: string;
}

export const databaseConfigSchema = Joi.object<DatabaseConfig>({
  url: Joi.string()
    .pattern(/^postgresql:\/\//)
    .required()
    .messages({
      'string.pattern.base':
        'DATABASE_URL must be a valid PostgreSQL connection string',
      'any.required': 'DATABASE_URL is required',
    }),
});
