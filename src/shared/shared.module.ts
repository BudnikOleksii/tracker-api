import { Module } from '@nestjs/common';

import { EmailService } from './services/email.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class SharedModule {}
