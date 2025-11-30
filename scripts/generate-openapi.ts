import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';

import { AppModule } from '../src/app.module';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = new DocumentBuilder()
    .setTitle('Track My Money API')
    .setDescription('API documentation for Track My Money application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('transactions', 'Transaction management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = join(__dirname, '..', 'openapi.json');

  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.warn(`OpenAPI specification generated at: ${outputPath}`);

  await app.close();
}

generateOpenApiSpec().catch((error) => {
  console.error('Error generating OpenAPI spec:', error);
  process.exit(1);
});
