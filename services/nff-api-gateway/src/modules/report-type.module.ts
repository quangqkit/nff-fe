import { Module } from '@nestjs/common';
import { ReportTypeController } from '../controllers/report-type.controller';
import { ReportTypeService } from '../services/report-type.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReportTypeController],
  providers: [ReportTypeService],
  exports: [ReportTypeService],
})
export class ReportTypeModule {}
