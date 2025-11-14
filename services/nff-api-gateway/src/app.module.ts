import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChartExportController } from './controllers/chart-export.controller';
import { ChartController } from './controllers/chart.controller';
import { ExportController } from './controllers/export.controller';
import { CorsMiddleware } from './middleware/cors.middleware';
import { AuthModule } from './modules/auth.module';
import { BlockModule } from './modules/block.module';
import { IndicatorETLModule } from './modules/indicator-etl.module';
import { IndicatorTimeSeriesModule } from './modules/indicator-time-series.module';
import { IndicatorModule } from './modules/indicator.module';
import { JobManagementModule } from './modules/job-management.module';
import { LobstrModule } from './modules/lobstr.module';
import { PrismaModule } from './modules/prisma.module';
import { ReportTypeModule } from './modules/report-type.module';
import { ReportModule } from './modules/report.module';
import { SchedulerModule } from './modules/scheduler.module';
import { TradingViewModule } from './modules/tradingview.module';
import { StoryModule } from './modules/story.module';
import { ChartExportService } from './services/chart-export.service';
import { ChartImageService } from './services/chart-image.service';
import { ChartService } from './services/chart.service';
import { ExportService } from './services/export.service';
import { HtmlService } from './services/html.service';
import { PdfHtmlGeneratorService } from './services/pdf-html-generator.service';
import { PdfService } from './services/pdf.service';
import { VercelBlobStorageService } from './services/vercel-blob-storage.service';

import config from './shared/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    ReportModule,
    ReportTypeModule,
    BlockModule,
    IndicatorModule,
    IndicatorETLModule,
    IndicatorTimeSeriesModule,
    JobManagementModule,
    LobstrModule,
    SchedulerModule,
    TradingViewModule,
    StoryModule,
  ],
  controllers: [
    AppController,
    ExportController,
    ChartController,
    ChartExportController,
  ],
  providers: [
    AppService,
    ExportService,
    ChartService,
    ChartExportService,
    ChartImageService,
    VercelBlobStorageService,
    HtmlService,
    PdfService,
    PdfHtmlGeneratorService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}
