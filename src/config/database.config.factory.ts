import { registerAs } from '@nestjs/config';

import { DatabaseConfig, databaseConfigSchema } from './database.config';

export default registerAs('database', (): DatabaseConfig => {
  const configValues: Partial<DatabaseConfig> = {
    url: process.env.DATABASE_URL,
  };

  const validationResult = databaseConfigSchema.validate(configValues, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (validationResult.error) {
    throw new Error(
      `Database configuration validation failed: ${validationResult.error.details
        .map((detail) => detail.message)
        .join(', ')}`,
    );
  }

  return validationResult.value;
});
