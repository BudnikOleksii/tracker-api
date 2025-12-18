import { registerAs } from '@nestjs/config';

import { AppConfig, appConfigSchema, Environment } from './app.config';

export default registerAs('app', (): AppConfig => {
  const configValues: Partial<AppConfig> = {
    nodeEnv: process.env.NODE_ENV as Environment,
    port: parseInt(process.env.PORT ?? '3000', 10),
    host: process.env.HOST,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').map((origin) =>
      origin.trim(),
    ) || ['http://localhost:3000'],
    swaggerPath: process.env.SWAGGER_PATH || '/api/docs',
  };

  const validationResult = appConfigSchema.validate(configValues, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (validationResult.error) {
    throw new Error(
      `App configuration validation failed: ${validationResult.error.details
        .map((detail) => detail.message)
        .join(', ')}`,
    );
  }

  return validationResult.value;
});
