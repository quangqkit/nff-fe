import { IsNotEmpty, IsString } from 'class-validator';

export class TradingViewDto {
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  preMarketChangePercent: string;

  @IsString()
  marketCap: string;
}
