import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';

import { AppModule } from '../src/app.module';
import { createSwaggerDocumentBuilder } from '../src/shared/utils/swagger.util';

async function generateOpenApiSpec() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const config = createSwaggerDocumentBuilder().build();
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
