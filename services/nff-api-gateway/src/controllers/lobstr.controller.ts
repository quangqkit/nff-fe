import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common';
import { LobstrService } from '../services/lobstr.service';
import { SchedulerService } from '../services/scheduler.service';
import { TriggerRunDto } from '../dto/trigger-run.dto';

@Controller('lobstr')
export class LobstrController {
  constructor(
    private readonly lobstrService: LobstrService,
    private readonly schedulerService: SchedulerService,
  ) {}

  @Get('squids')
  async getSquidsList() {
    return this.lobstrService.getSquidsList();
  }

  @Get('squids/:squidId')
  async getSquidDetails(@Param('squidId') squidId: string) {
    return this.lobstrService.getSquidDetails(squidId);
  }

  @Get('sync')
  async syncSquids() {
    return this.lobstrService.syncSquidsToDatabase();
  }

  @Get('schedules')
  async getSchedules() {
    return this.lobstrService.getSchedules();
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
    @Query('runId') runId?: string,
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

    return this.lobstrService.getRawDataList(runId, pageNum, pageSz);
  }

  @Post('raw-data/fetch')
  async triggerManualFetch(@Query('scheduleId') scheduleId: string) {
    if (!scheduleId) {
      throw new Error('scheduleId is required');
    }
    return this.schedulerService.triggerManualFetch(scheduleId);
  }
}
