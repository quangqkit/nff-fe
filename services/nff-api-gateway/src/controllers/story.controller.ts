import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { StoryService } from '../services/story.service';
import { StoryComposeService } from '../services/story-compose.service';
import { StoryType, StoryStatus } from '@prisma/client';

@Controller('api/stories')
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    private readonly composeService: StoryComposeService,
  ) {}

  @Post('group')
  @HttpCode(HttpStatus.OK)
  async groupTweets(@Body() body: { runId?: string; scheduleId?: string }) {
    return this.storyService.groupTweetsIntoStories(
      body.runId,
      body.scheduleId,
    );
  }

  @Get()
  async getStories(
    @Query('type') type?: StoryType,
    @Query('ticker') ticker?: string,
    @Query('sector') sector?: string,
    @Query('runId') runId?: string,
    @Query('status') status?: StoryStatus,
  ) {
    return this.storyService.getStories({
      type,
      ticker,
      sector,
      runId,
      status,
    });
  }

  @Get(':id')
  async getStoryById(@Param('id', ParseIntPipe) id: number) {
    return this.storyService.getStoryById(id);
  }

  @Post(':id/tweets')
  @HttpCode(HttpStatus.OK)
  async addTweetToStory(
    @Param('id', ParseIntPipe) storyId: number,
    @Body() body: { tweetId: string },
  ) {
    await this.storyService.addTweetToStory(storyId, body.tweetId);
    return { success: true };
  }

  @Delete(':id/tweets/:tweetId')
  @HttpCode(HttpStatus.OK)
  async removeTweetFromStory(
    @Param('id', ParseIntPipe) storyId: number,
    @Param('tweetId') tweetId: string,
  ) {
    await this.storyService.removeTweetFromStory(storyId, tweetId);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteStory(@Param('id', ParseIntPipe) id: number) {
    await this.storyService.deleteStory(id);
    return { success: true };
  }

  @Post(':id/compose')
  @HttpCode(HttpStatus.OK)
  async composeStory(@Param('id', ParseIntPipe) id: number) {
    return this.composeService.composeStory(id);
  }

  @Post('compose/batch')
  @HttpCode(HttpStatus.OK)
  async composeStories(@Body() body: { storyIds?: number[]; runId?: string }) {
    return this.composeService.composeStoriesBatch(body.storyIds, body.runId);
  }
}
