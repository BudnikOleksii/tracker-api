import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';

@Global()
@Module({
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
  exports: [JwtAuthGuard, RolesGuard],
})
export class CoreModule {}
