import {
  Controller,
  Get,
  Logger,
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
  private readonly logger = new Logger(AppController.name);
  private openApiContent: Record<string, unknown> | null = null;

  constructor(private readonly appService: AppService) {}

  async onModuleInit(): Promise<void> {
    const openApiPath = join(process.cwd(), 'openapi.json');
    try {
      const content = await readFile(openApiPath, 'utf-8');

      this.openApiContent = JSON.parse(content) as Record<string, unknown>;
    } catch {
      this.openApiContent = null;
      this.logger.warn(
        `[AppController] Open api content not found: ${openApiPath}`,
      );
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
  getOpenApiSpec() {
    if (!this.openApiContent) {
      throw new NotFoundException(
        'OpenAPI specification not found. Please generate the specifications first.',
      );
    }

    return this.openApiContent;
  }
}
