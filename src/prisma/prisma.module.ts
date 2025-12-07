import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';
import { ConfigModule } from '../config/config.module';

/**
 * PrismaModule provides the PrismaService as a global database access layer.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
