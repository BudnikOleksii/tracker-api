import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { beforeEach, describe, it } from '@jest/globals';

import { AppModule } from '../src/app.module';
import { AppConfigService } from '../src/config/app-config.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const configService = app.get(AppConfigService);
    app.setGlobalPrefix(configService.app.globalPrefix);
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: configService.app.apiVersion,
    });
    await app.init();
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect('Hello World!');
  });
});
