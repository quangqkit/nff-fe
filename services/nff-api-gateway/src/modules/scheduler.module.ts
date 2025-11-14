import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from '../services/scheduler.service';
import { HttpModule } from '@nestjs/axios';
import { LobstrService } from '../services/lobstr.service';
import { PrismaService } from '../services/prisma.service';
import { WindowScheduleService } from '../services/window-schedule.service';
import { LobstrModule } from './lobstr.module';
import { StoryModule } from './story.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule,
    forwardRef(() => LobstrModule),
    StoryModule,
  ],
  providers: [
    SchedulerService,
    LobstrService,
    PrismaService,
    WindowScheduleService,
  ],
  exports: [SchedulerService, WindowScheduleService],
})
export class SchedulerModule {}
