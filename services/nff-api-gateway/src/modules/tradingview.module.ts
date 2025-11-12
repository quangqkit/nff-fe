import { Module } from '@nestjs/common';
import { TradingViewController } from '../controllers/tradingview.controller';
import { PrismaService } from '../services/prisma.service';
import { TradingViewService } from '../services/tradingview.service';

@Module({
  controllers: [TradingViewController],
  providers: [TradingViewService, PrismaService],
  exports: [TradingViewService],
})
export class TradingViewModule {}
