import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TransactionStatisticsGroupDataDto {
  @ApiProperty({
    description: 'Group key (category name, currency, month, or year)',
    example: 'Groceries',
  })
  @Expose()
  key!: string;

  @ApiProperty({
    description: 'Total amount for this group',
    example: '1250.75',
  })
  @Expose()
  totalAmount!: string;

  @ApiProperty({
    description: 'Number of transactions in this group',
    example: 45,
  })
  @Expose()
  transactionCount!: number;
}

export class TransactionStatisticsDateRangeDto {
  @ApiProperty({
    description: 'Start date of the range',
    type: Date,
    nullable: true,
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  from!: Date | null;

  @ApiProperty({
    description: 'End date of the range',
    type: Date,
    nullable: true,
    example: '2024-12-31T23:59:59.999Z',
  })
  @Expose()
  @Type(() => Date)
  to!: Date | null;
}

export class TransactionStatisticsResponseDto {
  @ApiProperty({
    description: 'Total amount across all transactions',
    example: '12500.50',
  })
  @Expose()
  totalAmount!: string;

  @ApiProperty({
    description: 'Total number of transactions',
    example: 150,
  })
  @Expose()
  transactionCount!: number;

  @ApiProperty({
    description: 'Grouped statistics data',
    type: [TransactionStatisticsGroupDataDto],
  })
  @Expose()
  @Type(() => TransactionStatisticsGroupDataDto)
  groupedData!: TransactionStatisticsGroupDataDto[];

  @ApiProperty({
    description: 'Date range used for statistics',
    type: TransactionStatisticsDateRangeDto,
  })
  @Expose()
  @Type(() => TransactionStatisticsDateRangeDto)
  dateRange!: TransactionStatisticsDateRangeDto;
}
