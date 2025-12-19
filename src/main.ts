import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { createSwaggerDocumentBuilder } from './shared/utils/swagger.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(AppConfigService);

  app.setGlobalPrefix(configService.app.globalPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.app.apiVersion,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    credentials: true,
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || configService.app.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  });

  if (!configService.isProduction) {
    const config = createSwaggerDocumentBuilder().build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(configService.app.swaggerPath, app, document);
  }

  await app.listen(configService.app.port, configService.app.host);

  if (!configService.isProduction) {
    console.warn(
      `🚀 Application is running on: http://${configService.app.host}:${configService.app.port}`,
    );
  }
}

void bootstrap();
