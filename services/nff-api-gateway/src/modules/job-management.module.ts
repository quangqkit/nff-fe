import { Module } from '@nestjs/common';
import { JobManagementController } from '../controllers/job-management.controller';
import { JobManagementService } from '../services/job-management.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobManagementController],
  providers: [JobManagementService],
  exports: [JobManagementService],
})
export class JobManagementModule {}
