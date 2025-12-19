import {
  Controller,
  Get,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { AppService } from './app.service';

@ApiTags('app')
@Controller()
export class AppController implements OnModuleInit {
  private openApiContent: string | null = null;

  constructor(private readonly appService: AppService) {}

  async onModuleInit(): Promise<void> {
    const openApiPath = join(process.cwd(), 'openapi.json');
    try {
      this.openApiContent = await readFile(openApiPath, 'utf-8');
    } catch {
      //
    }
  }

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
  @ApiResponse({
    status: 404,
    description:
      'OpenAPI specification not found. Please generate the specifications first.',
  })
  getOpenApiSpec(): Record<string, unknown> {
    if (!this.openApiContent) {
      throw new NotFoundException(
        'OpenAPI specification not found. Please generate the specifications first.',
      );
    }

    return JSON.parse(this.openApiContent) as Record<string, unknown>;
  }
}
