import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * PrismaModule provides the PrismaService as a global database access layer.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
