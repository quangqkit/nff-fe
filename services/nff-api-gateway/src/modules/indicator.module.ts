import { Module } from '@nestjs/common';
import { IndicatorController } from '../controllers/indicator.controller';
import { IndicatorService } from '../services/indicator.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IndicatorController],
  providers: [IndicatorService],
  exports: [IndicatorService],
})
export class IndicatorModule {}
