import { DocumentBuilder } from '@nestjs/swagger';

export function createSwaggerDocumentBuilder(): DocumentBuilder {
  return new DocumentBuilder()
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
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
    })
    .addTag('auth', 'Authentication endpoints')
    .addTag('categories', 'Category management endpoints')
    .addTag('transactions', 'Transaction management endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('app', 'Application endpoints');
}
