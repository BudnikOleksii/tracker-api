import { Global, Module } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';

@Global()
@Module({
  providers: [
    JwtAuthGuard,
    RolesGuard,
    GlobalExceptionFilter,
    ResponseTransformInterceptor,
  ],
  exports: [
    JwtAuthGuard,
    RolesGuard,
    GlobalExceptionFilter,
    ResponseTransformInterceptor,
  ],
})
export class CoreModule {}

