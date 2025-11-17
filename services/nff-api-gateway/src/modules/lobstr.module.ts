import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LobstrController } from '../controllers/lobstr.controller';
import { TweetsController } from '../controllers/tweets.controller';
import { LobstrService } from '../services/lobstr.service';
import { TweetClassificationService } from '../services/tweet-classification.service';
import { PrismaModule } from './prisma.module';
import { SchedulerModule } from './scheduler.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
    forwardRef(() => SchedulerModule),
  ],
  controllers: [LobstrController, TweetsController],
  providers: [LobstrService, TweetClassificationService],
  exports: [LobstrService, TweetClassificationService],
})
export class LobstrModule {}
