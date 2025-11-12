import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LobstrController } from '../controllers/lobstr.controller';
import { LobstrService } from '../services/lobstr.service';
import { PrismaModule } from './prisma.module';
import { SchedulerModule } from './scheduler.module';

@Module({
  imports: [HttpModule, PrismaModule, SchedulerModule],
  controllers: [LobstrController],
  providers: [LobstrService],
  exports: [LobstrService],
})
export class LobstrModule {}
