import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionStatisticsQueryDto } from './dto/transaction-statistics-query.dto';
import { TransactionStatisticsResponseDto } from './dto/transaction-statistics-response.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(user.id, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() query: TransactionQueryDto,
  ): Promise<{
    data: TransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get('statistics')
  async getStatistics(
    @CurrentUser() user: { id: string },
    @Query() query: TransactionStatisticsQueryDto,
  ): Promise<TransactionStatisticsResponseDto> {
    return this.transactionsService.getStatistics(user.id, query);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(user.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ): Promise<void> {
    return this.transactionsService.remove(user.id, id);
  }
}
