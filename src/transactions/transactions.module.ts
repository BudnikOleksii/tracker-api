import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './repositories/transactions.repository';

@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
