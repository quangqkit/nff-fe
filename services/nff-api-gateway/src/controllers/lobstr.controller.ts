import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { LobstrService } from '../services/lobstr.service';
import { TriggerRunDto } from '../dto/trigger-run.dto';
import { WindowScheduleService } from '../services/window-schedule.service';
import { UpdateWindowScheduleStatusDto } from '../dto/update-window-schedule-status.dto';
import { UpdateScheduleStatusDto } from '../dto/update-schedule-status.dto';
import { TweetClassificationService } from '../services/tweet-classification.service';
import { ClassifyTweetsDto } from '../dto/classify-tweets.dto';

@Controller('lobstr')
export class LobstrController {
  constructor(
    private readonly lobstrService: LobstrService,
    private readonly windowScheduleService: WindowScheduleService,
    private readonly tweetClassificationService: TweetClassificationService,
  ) {}

  @Get('window-schedules')
  async getWindowSchedules() {
    return await this.windowScheduleService.getAllWindowSchedules();
  }

  @Patch('window-schedules/:windowScheduleId/status')
  async updateWindowScheduleStatus(
    @Param('windowScheduleId') windowScheduleIdParam: string,
    @Body() updateWindowScheduleStatusDto: UpdateWindowScheduleStatusDto,
  ) {
    const windowScheduleId = Number.parseInt(windowScheduleIdParam, 10);
    if (Number.isNaN(windowScheduleId)) {
      throw new BadRequestException('windowScheduleId must be a number');
    }
    return await this.windowScheduleService.setWindowScheduleStatus(
      windowScheduleId,
      updateWindowScheduleStatusDto.isActive,
    );
  }

  @Get('schedules/:scheduleId')
  async getSchedule(@Param('scheduleId') scheduleId: string) {
    return await this.lobstrService.getSchedule(scheduleId);
  }

  @Patch('schedules/:scheduleId/status')
  async updateScheduleStatus(
    @Param('scheduleId') scheduleId: string,
    @Body() updateScheduleStatusDto: UpdateScheduleStatusDto,
  ) {
    return await this.lobstrService.setScheduleStatus(
      scheduleId,
      updateScheduleStatusDto.isActive,
    );
  }

  @Post('trigger-run')
  async triggerRun(@Body() triggerRunDto: TriggerRunDto) {
    return this.lobstrService.triggerRun(triggerRunDto);
  }

  @Get('runs/:squidId')
  async getRunsList(@Param('squidId') squidId: string) {
    return this.lobstrService.getRunsList(squidId);
  }

  @Get('runs/:runId/download')
  async downloadRun(@Param('runId') runId: string) {
    return this.lobstrService.downloadRun(runId);
  }

  @Get('raw-data')
  async getRawDataList(
    @Query('pageNumber') pageNumber?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = pageNumber ? parseInt(pageNumber, 10) : 1;
    const pageSz = pageSize ? parseInt(pageSize, 10) : 50;

    if (pageNum < 1) {
      throw new Error('pageNumber must be >= 1');
    }
    if (pageSz < 1 || pageSz > 100) {
      throw new Error('pageSize must be between 1 and 100');
    }

    return this.lobstrService.getRawDataList(pageNum, pageSz);
  }

  @Post('classify')
  async classifyTweets(@Body() dto: ClassifyTweetsDto) {
    return await this.tweetClassificationService.classify(dto);
  }

  @Patch('tweets/:tweetId/category')
  async changeTweetCategory(
    @Param('tweetId') tweetId: string,
    @Body() body: { category: string },
  ) {
    return await this.tweetClassificationService.changeCategory(
      tweetId,
      body.category,
    );
  }
}
