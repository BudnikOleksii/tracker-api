import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig, Environment } from './app.config';
import { DatabaseConfig } from './database.config';
import { AuthConfig } from './auth.config';
import { EmailConfig } from './email.config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get app(): AppConfig {
    const config = this.configService.get<AppConfig>('app');

    if (!config) {
      throw new Error('App configuration is not available');
    }

    return config;
  }

  get database(): DatabaseConfig {
    const config = this.configService.get<DatabaseConfig>('database');

    if (!config) {
      throw new Error('Database configuration is not available');
    }

    return config;
  }

  get auth(): AuthConfig {
    const config = this.configService.get<AuthConfig>('auth');

    if (!config) {
      throw new Error('Auth configuration is not available');
    }

    return config;
  }

  get email(): EmailConfig {
    const config = this.configService.get<EmailConfig>('email');

    if (!config) {
      throw new Error('Email configuration is not available');
    }

    return config;
  }

  get isDevelopment(): boolean {
    return this.app.nodeEnv === Environment.Development;
  }

  get isProduction(): boolean {
    return this.app.nodeEnv === Environment.Production;
  }

  get isTest(): boolean {
    return this.app.nodeEnv === Environment.Test;
  }
}
