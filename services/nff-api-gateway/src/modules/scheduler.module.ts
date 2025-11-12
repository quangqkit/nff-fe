import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from '../services/scheduler.service';
import { HttpModule } from '@nestjs/axios';
import { LobstrService } from '../services/lobstr.service';
import { PrismaService } from '../services/prisma.service';
import { TradingViewModule } from './tradingview.module';

@Module({
  imports: [ScheduleModule.forRoot(), HttpModule, TradingViewModule],
  providers: [SchedulerService, LobstrService, PrismaService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
