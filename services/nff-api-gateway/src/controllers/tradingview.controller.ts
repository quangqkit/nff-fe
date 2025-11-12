import { Controller, Get, Query } from '@nestjs/common';
import { TradingViewDto } from '../dto/tradingview.dto';
import { TradingViewService } from '../services/tradingview.service';

@Controller('tradingview')
export class TradingViewController {
  constructor(private readonly tradingViewService: TradingViewService) {}

  @Get('pre-market')
  async getPreMarketData(
    @Query('type') type: 'gainers' | 'losers',
  ): Promise<TradingViewDto[]> {
    try {
      if (!type || (type !== 'gainers' && type !== 'losers')) {
        throw new Error(
          'Invalid type parameter. Must be "gainers" or "losers"',
        );
      }

      return await this.tradingViewService.getTradingViewData(type);
    } catch (err: any) {
      throw new Error(
        `Error in getting pre-market ${type} data: ${err?.message || 'Unknown error'}`,
      );
    }
  }

  @Get('pre-market/db')
  async getPreMarketDataFromDb(
    @Query('type') type: 'gainers' | 'losers',
  ): Promise<TradingViewDto[]> {
    try {
      if (!type || (type !== 'gainers' && type !== 'losers')) {
        throw new Error(
          'Invalid type parameter. Must be "gainers" or "losers"',
        );
      }

      return await this.tradingViewService.getTradingViewDataFromDb(type);
    } catch (err: any) {
      throw new Error(
        `Error in getting pre-market ${type} data from DB: ${err?.message || 'Unknown error'}`,
      );
    }
  }

  @Get('pre-market/symbols')
  async getSymbols(
    @Query('type') type: 'gainers' | 'losers',
  ): Promise<string[]> {
    try {
      if (!type || (type !== 'gainers' && type !== 'losers')) {
        throw new Error(
          'Invalid type parameter. Must be "gainers" or "losers"',
        );
      }

      return await this.tradingViewService.getSymbolsFromDb(type);
    } catch (err: any) {
      throw new Error(
        `Error in getting symbols for ${type}: ${err?.message || 'Unknown error'}`,
      );
    }
  }

  @Get('pre-market/search')
  async searchByName(
    @Query('type') type: 'gainers' | 'losers',
    @Query('name') name: string,
  ): Promise<TradingViewDto[]> {
    try {
      if (!type || (type !== 'gainers' && type !== 'losers')) {
        throw new Error(
          'Invalid type parameter. Must be "gainers" or "losers"',
        );
      }

      if (!name || name.trim().length === 0) {
        return [];
      }

      return await this.tradingViewService.searchByName(type, name.trim());
    } catch (err: any) {
      throw new Error(
        `Error in searching ${type} by name: ${err?.message || 'Unknown error'}`,
      );
    }
  }
}
