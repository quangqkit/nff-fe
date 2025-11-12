import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IndicatorETLController } from '../controllers/indicator-etl.controller';
import { IndicatorETLService } from '../services/indicator-etl.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [IndicatorETLController],
  providers: [IndicatorETLService],
  exports: [IndicatorETLService],
})
export class IndicatorETLModule {}
