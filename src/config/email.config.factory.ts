import { registerAs } from '@nestjs/config';

import { EmailConfig, emailConfigSchema } from './email.config';

export default registerAs('email', (): EmailConfig => {
  const configValues: Partial<EmailConfig> = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? Number.parseInt(process.env.EMAIL_PORT, 10) : undefined,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM,
  };

  const validationResult = emailConfigSchema.validate(configValues, {
    abortEarly: false,
    allowUnknown: false,
  });

  if (validationResult.error) {
    throw new Error(
      `Email configuration validation failed: ${validationResult.error.details
        .map((detail) => detail.message)
        .join(', ')}`,
    );
  }

  return validationResult.value;
});

