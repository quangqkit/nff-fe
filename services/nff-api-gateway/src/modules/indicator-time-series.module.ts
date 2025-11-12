import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma.module';
import { IndicatorTimeSeriesService } from '../services/indicator-time-series.service';
import { IndicatorTimeSeriesController } from '../controllers/indicator-time-series.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IndicatorTimeSeriesController],
  providers: [IndicatorTimeSeriesService],
  exports: [IndicatorTimeSeriesService],
})
export class IndicatorTimeSeriesModule {}
