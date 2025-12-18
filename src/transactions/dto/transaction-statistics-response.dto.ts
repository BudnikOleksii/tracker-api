import { Expose, Type } from 'class-transformer';

export class TransactionStatisticsGroupDataDto {
  @Expose()
  key!: string;

  @Expose()
  totalAmount!: string;

  @Expose()
  transactionCount!: number;
}

export class TransactionStatisticsDateRangeDto {
  @Expose()
  @Type(() => Date)
  from!: Date | null;

  @Expose()
  @Type(() => Date)
  to!: Date | null;
}

export class TransactionStatisticsResponseDto {
  @Expose()
  totalAmount!: string;

  @Expose()
  transactionCount!: number;

  @Expose()
  @Type(() => TransactionStatisticsGroupDataDto)
  groupedData!: TransactionStatisticsGroupDataDto[];

  @Expose()
  @Type(() => TransactionStatisticsDateRangeDto)
  dateRange!: TransactionStatisticsDateRangeDto;
}
