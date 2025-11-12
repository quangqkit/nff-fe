import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IndicatorETLService } from '../services/indicator-etl.service';
import { ImportExcelDto, FullFetchDto } from '../dto/indicator-etl.dto';
import { CleanETLTablesDto } from '../dto/clean-etl.dto';

@ApiTags('Indicator ETL')
@Controller('indicators/etl')
export class IndicatorETLController {
  private readonly logger = new Logger(IndicatorETLController.name);

  constructor(private readonly indicatorETLService: IndicatorETLService) {}

  @Post('full-fetch')
  async triggerFullFetch(@Body() request: FullFetchDto) {
    try {
      const result = await this.indicatorETLService.triggerFullHistoricalFetch(
        request.categoryName,
        request.startDate,
        request.endDate,
        request.importanceMin,
      );

      return {
        success: true,
        message: `Full historical fetch started for category '${request.categoryName}'`,
        jobId: result.jobId,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('import-excel')
  @ApiOperation({
    summary: 'Import indicators from Excel file using EXCEL_IMPORT_PATH',
  })
  @ApiResponse({
    status: 200,
    description: 'Excel import started successfully',
  })
  async importFromExcel(@Body() request: ImportExcelDto) {
    try {
      const excelPath = process.env.EXCEL_IMPORT_PATH;
      if (!excelPath) {
        throw new HttpException(
          'EXCEL_IMPORT_PATH environment variable is not set',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const result = await this.indicatorETLService.importIndicatorsFromExcel(
        excelPath,
        request.sheetName,
        request.categoryName,
      );

      return {
        success: true,
        message: `Excel import started for sheet '${request.sheetName}' -> category '${request.categoryName}'`,
        jobId: result.jobId,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('clean-etl-tables')
  async cleanETLTables(@Body() body: CleanETLTablesDto) {
    if (body.confirmCleanup !== true) {
      throw new HttpException(
        'Cleanup confirmation required. Set confirmCleanup to true.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.indicatorETLService.cleanETLTables();

      return {
        success: true,
        message: 'ETL tables cleaned successfully',
        deleted: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
