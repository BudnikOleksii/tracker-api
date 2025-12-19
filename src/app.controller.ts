import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns a simple health check message',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is running',
    schema: { type: 'string', example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('openapi.json')
  @ApiOperation({
    summary: 'OpenAPI specification',
    description: 'Returns the OpenAPI 3.0 specification in JSON format',
  })
  @ApiResponse({
    status: 200,
    description: 'OpenAPI specification',
    content: {
      'application/json': {
        schema: { type: 'object' },
      },
    },
  })
  getOpenApiSpec(@Res() res: Response): void {
    const openApiPath = join(process.cwd(), 'openapi.json');
    try {
      const openApiContent = readFileSync(openApiPath, 'utf-8');
      res.setHeader('Content-Type', 'application/json');
      res.send(openApiContent);
    } catch {
      res.status(404).json({
        error: 'OpenAPI specification not found',
        message: 'Please generate the specifications first',
      });
    }
  }
}
