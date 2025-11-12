import { Module } from '@nestjs/common';
import { ReportController } from '../controllers/report.controller';
import { ChartController } from '../controllers/chart.controller';
import { SectionController } from '../controllers/section.controller';
import { ReportService } from '../services/report.service';
import { BlockModule } from './block.module';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, BlockModule],
  controllers: [ReportController, ChartController, SectionController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
