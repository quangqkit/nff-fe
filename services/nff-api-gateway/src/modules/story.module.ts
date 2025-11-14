import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { StoryController } from '../controllers/story.controller';
import { StoryService } from '../services/story.service';
import { StoryComposeService } from '../services/story-compose.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [HttpModule, ConfigModule, PrismaModule],
  controllers: [StoryController],
  providers: [StoryService, StoryComposeService],
  exports: [StoryService, StoryComposeService],
})
export class StoryModule {}
