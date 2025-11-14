import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VercelBlobStorageService } from './vercel-blob-storage.service';

export interface ChartImageResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  storageUrl?: string;
  storageKey?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }>;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  plugins?: {
    title?: {
      display: boolean;
      text: string;
      font?: {
        size?: number;
        family?: string;
        weight?: string | number;
      };
      color?: string;
    };
    legend?: {
      display: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        usePointStyle?: boolean;
        pointStyle?: string;
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string | number;
        };
      };
    };
    tooltip?: {
      enabled?: boolean;
      mode?: string;
      intersect?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
  };
  scales?: {
    x?: {
      title?: {
        display?: boolean;
        text?: string;
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string | number;
        };
      };
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string | number;
        };
      };
    };
    y?: {
      title?: {
        display?: boolean;
        text?: string;
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string | number;
        };
      };
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
        font?: {
          size?: number;
          family?: string;
          weight?: string | number;
        };
      };
      beginAtZero?: boolean;
    };
  };
}

@Injectable()
export class ChartImageService {
  private readonly logger = new Logger(ChartImageService.name);
  private readonly exportBasePath =
    process.env.EXPORT_STORAGE_PATH || path.join(process.cwd(), 'exports');
  private browser: puppeteer.Browser | null = null;

  constructor(private readonly blobStorage: VercelBlobStorageService) {}

  async generateChartImage(
    chartData: ChartData,
    chartType: 'line' | 'bar' | 'area' | 'doughnut' | 'pie',
    options: ChartOptions = {},
    fileName?: string,
    width: number = 800,
    height: number = 400,
    sharedBrowser?: puppeteer.Browser,
  ): Promise<ChartImageResult> {
    this.logger.log(`Generating ${chartType} chart image using Puppeteer`);

    let browser: puppeteer.Browser | null = null;

    try {
      const chartDir = path.join(this.exportBasePath, 'charts');
      await fs.ensureDir(chartDir);

      const imageFileName = fileName || `chart_${uuidv4()}.png`;
      const imageFilePath = path.join(chartDir, imageFileName);

      if (sharedBrowser) {
        browser = sharedBrowser;
      } else if (!this.browser || !this.browser.isConnected()) {
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        });
        this.browser = browser;
      } else {
        browser = this.browser;
      }

      const page = await browser.newPage();
      try {
        await page.setViewport({ width, height });
        const htmlContent = this.generateChartHtml(
          chartData,
          chartType,
          options,
          width,
          height,
        );

        await page.setContent(htmlContent, {
          waitUntil: 'domcontentloaded',
          timeout: 100000,
        });

        await page.waitForSelector('canvas', { timeout: 10000 });

        await new Promise((resolve) => setTimeout(resolve, 500));

        const canvas = await page.$('canvas');
        if (!canvas) {
          throw new Error('Canvas element not found');
        }

        await canvas.screenshot({ path: imageFilePath as `${string}.png` });
      } finally {
        await page.close();
      }

      const stats = await fs.stat(imageFilePath);
      const fileSize = stats.size;

      this.logger.log(
        `Chart image generated successfully: ${imageFilePath} (${fileSize} bytes)`,
      );

      let storageUrl: string | undefined;
      let storageKey: string | undefined;

      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

      if (blobToken) {
        try {
          const chartId = `chart_${uuidv4()}`;
          const uploadResult = await this.blobStorage.uploadChartImage(
            imageFilePath,
            chartId,
            {
              chartType,
              generatedAt: new Date().toISOString(),
            },
          );

          storageUrl = uploadResult.url;
          storageKey = uploadResult.key;

          this.logger.log(
            `Chart image uploaded to Vercel Blob: ${storageKey} -> ${storageUrl}`,
          );

          if (process.env.CLEANUP_LOCAL_FILES === 'true') {
            await fs.remove(imageFilePath);
            this.logger.log(`Local chart image cleaned up: ${imageFilePath}`);
          }
        } catch (storageError) {
          this.logger.warn(
            `Failed to upload chart image to Vercel Blob: ${storageError.message}`,
          );
        }
      }

      return {
        filePath: imageFilePath,
        fileName: imageFileName,
        fileSize,
        storageUrl,
        storageKey,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate chart image: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      if (browser && !sharedBrowser && browser !== this.browser) {
        await browser.close();
      }
    }
  }

  private generateChartHtml(
    chartData: ChartData,
    chartType: string,
    options: ChartOptions,
    width: number,
    height: number,
  ): string {
    const chartConfig = this.prepareChartConfig(chartData, chartType, options);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Chart</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: white;
        }
        .chart-container {
            width: ${width}px;
            height: ${height}px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <canvas id="chart"></canvas>
    </div>
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        const config = ${JSON.stringify(chartConfig)};
        new Chart(ctx, config);
    </script>
</body>
</html>`;
  }

  private prepareChartConfig(
    chartData: ChartData,
    chartType: string,
    options: ChartOptions,
  ): any {
    const defaultOptions = this.getDefaultChartOptions(chartType);

    return {
      type: chartType,
      data: chartData,
      options: {
        ...defaultOptions,
        ...options,
      },
    };
  }

  private prepareChartOptions(chartConfig: any): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!chartConfig?.title,
          text: chartConfig?.title || '',
          font: {
            size: 16,
            family: 'Arial',
            weight: 'bold',
          },
          color: '#000000',
        },
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            color: '#000000',
            font: {
              size: 12,
              family: 'Arial',
            },
          },
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: '#ffffff',
          titleColor: '#000000',
          bodyColor: '#000000',
          borderColor: '#e0e0e0',
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: !!chartConfig?.xAxis?.title,
            text: chartConfig?.xAxis?.title || 'X Axis',
            color: '#000000',
            font: {
              size: 12,
              family: 'Arial',
            },
          },
          grid: {
            display: false,
          },
          ticks: {
            color: '#000000',
            font: {
              size: 11,
              family: 'Arial',
            },
          },
        },
        y: {
          title: {
            display: !!chartConfig?.yAxis?.title,
            text: chartConfig?.yAxis?.title || 'Y Axis',
            color: '#000000',
            font: {
              size: 12,
              family: 'Arial',
            },
          },
          grid: {
            display: true,
            color: 'rgba(0,0,0,0.1)',
          },
          ticks: {
            color: '#000000',
            font: {
              size: 11,
              family: 'Arial',
            },
          },
          beginAtZero: false,
        },
      },
    };
  }

  private determineChartType(
    chartConfig: any,
  ): 'line' | 'bar' | 'area' | 'doughnut' | 'pie' {
    const type = chartConfig?.type?.toLowerCase();

    switch (type) {
      case 'bar':
        return 'bar';
      case 'area':
        return 'area';
      case 'doughnut':
      case 'donut':
        return 'doughnut';
      case 'pie':
        return 'pie';
      case 'line':
      default:
        return 'line';
    }
  }

  private getDefaultChartOptions(chartType: string): ChartOptions {
    const baseOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
        },
      },
    };

    if (chartType === 'doughnut' || chartType === 'pie') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            display: true,
            position: 'bottom',
          },
        },
        scales: undefined,
      };
    }

    return baseOptions;
  }

  async generateChartImagesFromBlocks(
    blocks: any[],
    width: number = 800,
    height: number = 400,
  ): Promise<Map<number, ChartImageResult>> {
    this.logger.log(
      `Generating ${blocks.length} chart images in parallel with browser reuse`,
    );

    const results = new Map<number, ChartImageResult>();

    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });
    }

    try {
      const chartImagePromises = blocks.map(async (block) => {
        try {
          const result = await this.generateChartImageFromBlock(
            block,
            width,
            height,
            this.browser!,
          );
          return { blockId: block.id, result };
        } catch (error) {
          this.logger.error(
            `Failed to generate chart image for block ${block.id}: ${error.message}`,
          );
          return { blockId: block.id, result: null };
        }
      });

      const chartResults = await Promise.all(chartImagePromises);

      for (const { blockId, result } of chartResults) {
        if (result) {
          results.set(blockId, result);
        }
      }

      this.logger.log(
        `Successfully generated ${results.size} chart images out of ${blocks.length} blocks`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate chart images in parallel: ${error.message}`,
      );
    } finally {
      if (this.browser && this.browser.isConnected()) {
        await this.browser.close();
        this.browser = null;
      }
    }

    return results;
  }

  async generateChartImageFromBlock(
    block: any,
    width: number = 800,
    height: number = 400,
    sharedBrowser?: puppeteer.Browser,
  ): Promise<ChartImageResult | null> {
    this.logger.log(`Generating chart image for block ${block.id}:`, {
      type: block.type,
      hasContent: !!block.content,
      hasChartData: !!block.content?.chartData,
      chartDataKeys: block.content?.chartData
        ? Object.keys(block.content.chartData)
        : [],
      datasetsLength: block.content?.chartData?.datasets?.length || 0,
    });

    if (block.type !== 'CHART' || !block.content?.chartData) {
      this.logger.warn(
        `Block ${block.id} is not a chart block or missing chart data`,
      );
      return null;
    }

    try {
      const chartData = block.content.chartData as ChartData;
      const chartType = this.determineChartType(block.content.chartConfig);
      const options = this.prepareChartOptions(block.content.chartConfig);

      const fileName = `chart_block_${block.id}_${Date.now()}.png`;

      return await this.generateChartImage(
        chartData,
        chartType,
        options,
        fileName,
        width,
        height,
        sharedBrowser,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate chart image from block ${block.id}: ${error.message}`,
      );
      return null;
    }
  }

  async cleanupBrowser(): Promise<void> {
    if (this.browser && this.browser.isConnected()) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser cleaned up');
    }
  }

  async cleanupOldChartImages(maxAgeHours: number = 24): Promise<void> {
    try {
      const chartDir = path.join(this.exportBasePath, 'charts');

      if (!(await fs.pathExists(chartDir))) {
        return;
      }

      const files = await fs.readdir(chartDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(chartDir, file);
        const stats = await fs.stat(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          deletedCount++;
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} old chart images`);
    } catch (error) {
      this.logger.error(`Failed to cleanup old chart images: ${error.message}`);
    }
  }
}
