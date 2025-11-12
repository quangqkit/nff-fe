import { Module } from '@nestjs/common';
import { BlockController } from '../controllers/block.controller';
import { ChartController } from '../controllers/chart.controller';
import { SectionController } from '../controllers/section.controller';
import { BlockService } from '../services/block.service';
import { ChartService } from '../services/chart.service';
import { ChartExportService } from '../services/chart-export.service';
import { SectionService } from '../services/section.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BlockController, ChartController, SectionController],
  providers: [BlockService, ChartService, ChartExportService, SectionService],
  exports: [BlockService, ChartService, ChartExportService, SectionService],
})
export class BlockModule {}
