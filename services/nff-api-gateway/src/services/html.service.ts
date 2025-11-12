import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ChartImageService } from './chart-image.service';
export interface HtmlResult {
  filePath: string;
  fileSize: number;
}

@Injectable()
export class HtmlService {
  private readonly logger = new Logger(HtmlService.name);
  private readonly exportBasePath =
    process.env.EXPORT_STORAGE_PATH || './exports';

  constructor(private readonly chartImageService: ChartImageService) {}

  async generateHtml(report: any): Promise<HtmlResult> {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const timestamp = `${year}${month}${day}_${hours}${minutes}`;

    const htmlFileName = `${report.id}_${timestamp}.html`;
    const htmlFilePath = path.join(this.exportBasePath, 'html', htmlFileName);

    try {
      await fs.ensureDir(path.dirname(htmlFilePath));

      const htmlContent = await this.generateWixCompatibleHtmlContent(report);
      await fs.writeFile(htmlFilePath, htmlContent, 'utf8');

      const stats = await fs.stat(htmlFilePath);
      const fileSize = stats.size;

      this.logger.log(`HTML generated successfully: ${htmlFilePath}`);

      return {
        filePath: htmlFilePath,
        fileSize,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate HTML: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private getHtmlHeader(report: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${this.escapeHtml(report.title)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header-logo {
            margin-bottom: 20px;
            display: flex;
            justify-content: center;
        }
        .logo-image {
            width: 200px;
            height: auto;
            max-width: 100%;
        }
        .header-title {
            margin-bottom: 15px;
        }
        .report-title {
            color: #333;
            margin: 0;
            font-size: 32px;
            font-weight: bold;
        }
        .header-date {
            text-align: center;
        }
        .report-date {
            color: #666;
            font-size: 16px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #707FDD;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .block {
            padding: 1.5rem;
            background-color: white;
            border: 1px solid #c7d2fe;
            border-radius: 0.75rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
            transition: all 300ms;
            margin-bottom: 20px;
        }
        .block:hover {
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
            border-color: #707FDD;
        }
        .dot {
            display: inline-block;
            width: 12px;
            height: 12px;
            background-color: #707FDD;
            border-radius: 50%;
            margin-right: 8px;
            vertical-align: middle;
        }
        .block h3 {
            color: #333;
            margin-top: 0px;
            font-size: 16px;
        }
        .text-content {
            color: #374151;
            line-height: 1.625;
            background-color: #f0f2ff;
            padding: 1rem;
            border-radius: 0.5rem;
            border-left: 4px solid #707FDD;
        }
        
        .text-content p {
            margin: 0;
        }
        .chart-container {
            text-align: center;
            margin: 20px 0;
        }
        .chart-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        ul, ol {
            margin: 10px 0;
            padding-left: 20px;
        }
        li {
            margin-bottom: 5px;
        }
        .note {
            background-color: #f8f9fa;
            border-left: 4px solid #707FDD;
            padding: 15px;
            margin: 15px 0;
            border-radius: 0 4px 4px 0;
        }
        .note.warning {
            border-left-color: #ffc107;
            background-color: #fff3cd;
        }
        .note.error {
            border-left-color: #dc3545;
            background-color: #f8d7da;
        }
        .note.success {
            border-left-color: #28a745;
            background-color: #d4edda;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .footer-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        .footer-logo {
            flex-shrink: 0;
        }
        .footer-image {
            width: 80px;
            height: auto;
            max-width: 100%;
        }
        .footer-text {
            text-align: center;
            flex-grow: 1;
            margin: 0 20px;
            min-width: 200px;
        }
        .footer-copyright {
            margin: 0;
            font-size: 12px;
            color: #9ca3af;
            line-height: 1.4;
        }
        .footer-page {
            font-size: 14px;
            color: #6b7280;
            flex-shrink: 0;
        }
        /* Tablet Styles */
        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            .logo-image {
                width: 150px;
            }
            .report-title {
                font-size: 28px;
            }
            .report-date {
                font-size: 15px;
            }
            .section h2 {
                font-size: 18px;
            }
            .block h3 {
                font-size: 14px;
            }
            .text-content {
                font-size: 14px;
                padding: 0.8rem;
            }
            table {
                font-size: 13px;
            }
            .footer {
                padding-top: 15px;
            }
            .footer-image {
                width: 70px;
            }
            .footer-copyright {
                font-size: 11px;
            }
            .footer-page {
                font-size: 13px;
            }
        }
        
        /* Mobile Styles */
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 15px;
                max-width: 100%;
            }
            .logo-image {
                width: 120px;
            }
            .report-title {
                font-size: 24px;
            }
            .report-date {
                font-size: 14px;
            }
            .section h2 {
                font-size: 16px;
            }
            .block {
                padding: 1rem;
                margin-bottom: 15px;
            }
            .block h3 {
                font-size: 13px;
            }
            .text-content {
                font-size: 13px;
                padding: 0.7rem;
            }
            table {
                font-size: 12px;
            }
            table th, table td {
                padding: 8px;
            }
            .chart-container img {
                max-width: 100%;
                height: auto;
            }
            .footer {
                padding-top: 10px;
                margin-top: 20px;
            }
            .footer-content {
                flex-direction: column;
                text-align: center;
            }
            .footer-logo {
                margin-bottom: 10px;
            }
            .footer-image {
                width: 60px;
            }
            .footer-text {
                margin: 0 0 10px 0;
                min-width: auto;
            }
            .footer-copyright {
                font-size: 10px;
            }
            .footer-page {
                font-size: 12px;
            }
        }
        
        /* Small Mobile Styles */
        @media (max-width: 320px) {
            .container {
                padding: 10px;
            }
            .logo-image {
                width: 100px;
            }
            .report-title {
                font-size: 20px;
            }
            .report-date {
                font-size: 12px;
            }
            .section h2 {
                font-size: 14px;
            }
            .block h3 {
                font-size: 12px;
            }
            .text-content {
                font-size: 12px;
                padding: 0.6rem;
            }
            .footer-image {
                width: 50px;
            }
            .footer-copyright {
                font-size: 9px;
            }
            .footer-page {
                font-size: 11px;
            }
        }
    </style>
</head>
<body>
    <div class="container">`;
  }

  private escapeHtml(text: string): string {
    if (!text) return '';

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatTextContent(content: string): string {
    if (!content) return '';

    return content.replace(/\n/g, '<br>').replace(/\r\n/g, '<br>');
  }

  private async generateWixCompatibleHtmlContent(report: any): Promise<string> {
    const sections = report.sections || [];

    let html = `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4; font-family: Arial, sans-serif; line-height: 1.6;">
        <tr>
            <td align="center" style="padding: 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="700" style="max-width: 700px; background-color: white;">
                    <tr>
                        <td style="padding: 20px;">`;

    html += this.generateTableBasedHeader(report);

    for (const section of sections) {
      html += await this.generateTableBasedSectionHtml(section);
    }

    html += this.generateTableBasedFooter();

    html += `                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>`;

    return html;
  }

  private async generateTableBasedSectionHtml(section: any): Promise<string> {
    const blocks = section.blocks || [];
    if (blocks.length === 0) {
      return '';
    }

    let html = `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                        <tr>
                            <td>
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td>
                                            <h2 style="color: #707FDD; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 15px; font-family: Arial, sans-serif; font-size: 20px;">${this.escapeHtml(section.title)}</h2>
                                        </td>
                                    </tr>`;

    for (const block of blocks) {
      html += await this.generateTableBasedBlockHtml(block);
    }

    html += `
                                </table>
                            </td>
                        </tr>
                    </table>`;

    return html;
  }

  private async generateTableBasedBlockHtml(block: any): Promise<string> {
    switch (block.type) {
      case 'TEXT':
        return this.generateTableBasedTextBlockHtml(block);
      case 'CHART':
        return await this.generateTableBasedChartBlockHtml(block);
      case 'TABLE':
        return this.generateTableBasedTableBlockHtml(block);
      case 'BULLETS':
        return this.generateTableBasedBulletsBlockHtml(block);
      case 'NOTES':
        return this.generateTableBasedNotesBlockHtml(block);
      default:
        return `<!-- Unknown block type: ${block.type} -->`;
    }
  }

  private getRelativeImagePath(absolutePath: string): string {
    const normalizedPath = absolutePath.replace(/\\/g, '/');

    return `file://${normalizedPath}`;
  }

  private formatDateWithOrdinal(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();

    let ordinal = '';
    if (day === 1 || day === 21 || day === 31) {
      ordinal = 'st';
    } else if (day === 2 || day === 22) {
      ordinal = 'nd';
    } else if (day === 3 || day === 23) {
      ordinal = 'rd';
    } else {
      ordinal = 'th';
    }

    return `${month} ${day}${ordinal}, ${year}`;
  }

  private generateTableBasedHeader(report: any): string {
    const currentDate = this.formatDateWithOrdinal(new Date());

    return `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 30px;">
                        <tr>
                            <td align="center" style="padding-bottom: 20px;">
                                <div style="font-family: 'Zalando Sans Expanded', sans-serif; font-weight: bold; font-size: 16px; color: #000000; line-height: 1.1; letter-spacing: 0.5px; text-transform: uppercase; text-align: left; display: inline-block;">
                                    <div style="display: block; margin: 0; padding: 0;">NO</div>
                                    <div style="display: block; margin: 0; padding: 0;">FILTER</div>
                                    <div style="display: block; margin: 0; padding: 0;">FINANCE</div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding-bottom: 10px;">
                                <h1 style="color: #333; margin: 0; font-size: 32px; font-weight: bold; font-family: Arial, sans-serif;">${this.escapeHtml(report.title)}</h1>
                            </td>
                        </tr>
                        <tr>
                            <td align="center">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td align="center" style="color: #666; font-size: 16px; font-family: Arial, sans-serif;">${currentDate}</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>`;
  }

  private generateTableBasedTextBlockHtml(block: any): string {
    const content = block.content?.richText || block.content?.plainText || '';

    return `
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: white; border: 1px solid #c7d2fe; border-radius: 0.75rem;">
                                                <tr>
                                                    <td style="padding: 1.5rem;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                        <tr>
                                                                            <td style="width: 12px; padding-right: 8px; vertical-align: top;">
                                                                                <table cellpadding="0" cellspacing="0" border="0" width="12">
                                                                                    <tr>
                                                                                        <td style="width: 12px; height: 12px; background-color: #707FDD; border-radius: 50%;"></td>
                                                                                    </tr>
                                                                                </table>
                                                                            </td>
                                                                            <td>
                                                                                <h3 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">${this.escapeHtml(block.name)}</h3>
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding-top: 10px;">
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f0f2ff; border-left: 4px solid #707FDD;">
                                                                        <tr>
                                                                            <td style="padding: 1rem; color: #374151; line-height: 1.625; font-family: Arial, sans-serif;">
                                                                                ${this.formatTextContent(content)}
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;
  }

  private async generateTableBasedChartBlockHtml(block: any): Promise<string> {
    let html = `
                                    <tr>
                                        <td style="padding-bottom: 20px;">`;

    try {
      this.logger.log(`Processing chart block ${block.id}:`, {
        hasContent: !!block.content,
        hasChartData: !!block.content?.chartData,
        hasDatasets: !!block.content?.chartData?.datasets,
        datasetsLength: block.content?.chartData?.datasets?.length || 0,
      });

      if (
        block.content?.chartData &&
        block.content.chartData.datasets?.length > 0
      ) {
        const chartImageResult =
          await this.chartImageService.generateChartImageFromBlock(block);

        if (chartImageResult) {
          const imageSrc =
            chartImageResult.storageUrl ||
            this.getRelativeImagePath(chartImageResult.filePath);

          html += `<img src="${this.escapeHtml(imageSrc)}" alt="Chart" style="max-width: 100%; height: auto;">`;

          if (chartImageResult.storageUrl) {
            this.logger.log(
              `Chart image with storage URL generated for block ${block.id}: ${chartImageResult.storageUrl}`,
            );
          } else {
            this.logger.log(
              `Chart image generated for block ${block.id}: ${chartImageResult.filePath}`,
            );
          }
        } else {
          html += `<table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="center" style="color: #666; font-style: italic; font-family: Arial, sans-serif;">Failed to generate chart image</td>
                                                        </tr>
                                                    </table>`;
        }
      } else {
        html += `<table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="center" style="color: #666; font-style: italic; font-family: Arial, sans-serif;">Chart data not available</td>
                                                        </tr>
                                                    </table>`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate chart for block ${block.id}: ${error.message}`,
      );
      html += `<table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                        <tr>
                                                            <td align="center" style="color: #666; font-style: italic; font-family: Arial, sans-serif;">Chart generation failed</td>
                                                        </tr>
                                                    </table>`;
    }

    html += `
                                        </td>
                                    </tr>`;

    return html;
  }

  private generateTableBasedTableBlockHtml(block: any): string {
    const headers = block.content?.headers || [];
    const rows = block.content?.rows || [];

    if (headers.length === 0 || rows.length === 0) {
      return `
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: white; border: 1px solid #c7d2fe; border-radius: 0.75rem;">
                                                <tr>
                                                    <td style="padding: 1.5rem;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <h3 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">${this.escapeHtml(block.name)}</h3>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding-top: 10px;">
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                        <tr>
                                                                            <td style="color: #666; font-style: italic; font-family: Arial, sans-serif;">No table data available</td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;
    }

    let html = `
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: white; border: 1px solid #c7d2fe; border-radius: 0.75rem;">
                                                <tr>
                                                    <td style="padding: 1.5rem;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <h3 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">${this.escapeHtml(block.name)}</h3>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding-top: 15px;">
                                                                    <table cellpadding="0" cellspacing="0" border="1" width="100%" style="border-collapse: collapse;">
                                                                        <tr>`;

    for (const header of headers) {
      html += `<td style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f8f9fa; font-weight: bold; font-family: Arial, sans-serif;">${this.escapeHtml(header)}</td>`;
    }

    html += `
                                                                        </tr>`;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const backgroundColor = i % 2 === 0 ? '#f8f9fa' : 'white';
      html += `<tr style="background-color: ${backgroundColor};">`;
      for (const cell of row) {
        html += `<td style="border: 1px solid #ddd; padding: 12px; text-align: left; font-family: Arial, sans-serif;">${this.escapeHtml(String(cell))}</td>`;
      }
      html += `</tr>`;
    }

    html += `
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;

    return html;
  }

  private generateTableBasedBulletsBlockHtml(block: any): string {
    const bullets = block.content?.bullets || [];

    if (bullets.length === 0) {
      return `
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: white; border: 1px solid #c7d2fe; border-radius: 0.75rem;">
                                                <tr>
                                                    <td style="padding: 1.5rem;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <h3 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">${this.escapeHtml(block.name)}</h3>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding-top: 10px;">
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                                        <tr>
                                                                            <td style="color: #666; font-style: italic; font-family: Arial, sans-serif;">No bullet points available</td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;
    }

    let html = `
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: white; border: 1px solid #c7d2fe; border-radius: 0.75rem;">
                                                <tr>
                                                    <td style="padding: 1.5rem;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <h3 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">${this.escapeHtml(block.name)}</h3>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding-top: 10px;">
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%">`;

    for (const bullet of bullets) {
      const indent = (bullet.level || 0) * 20;
      html += `<tr>
                                                                        <td style="padding-left: ${indent + 20}px; padding-bottom: 5px; font-family: Arial, sans-serif;">
                                                                            • ${this.escapeHtml(bullet.text)}
                                                                        </td>
                                                                    </tr>`;
    }

    html += `
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;

    return html;
  }

  private generateTableBasedNotesBlockHtml(block: any): string {
    const noteText = block.content?.noteText || '';
    const noteType = block.content?.noteType || 'info';

    let borderColor = '#007cba';
    let backgroundColor = '#f8f9fa';

    switch (noteType) {
      case 'warning':
        borderColor = '#ffc107';
        backgroundColor = '#fff3cd';
        break;
      case 'error':
        borderColor = '#dc3545';
        backgroundColor = '#f8d7da';
        break;
      case 'success':
        borderColor = '#28a745';
        backgroundColor = '#d4edda';
        break;
    }

    return `
                                    <tr>
                                        <td style="padding-bottom: 20px;">
                                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: white; border: 1px solid #c7d2fe; border-radius: 0.75rem;">
                                                <tr>
                                                    <td style="padding: 1.5rem;">
                                                        <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                                            <tr>
                                                                <td>
                                                                    <h3 style="color: #333; margin: 0; font-size: 16px; font-family: Arial, sans-serif;">${this.escapeHtml(block.name)}</h3>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="padding-top: 15px;">
                                                                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${backgroundColor}; border-left: 4px solid ${borderColor}; border-radius: 0 4px 4px 0;">
                                                                        <tr>
                                                                            <td style="padding: 15px; font-family: Arial, sans-serif;">
                                                                                ${this.formatTextContent(noteText)}
                                                                            </td>
                                                                        </tr>
                                                                    </table>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>`;
  }

  private generateTableBasedFooter(): string {
    const footerImagePath =
      'https://nff-auto-report-prod-reportsbucketbucket-nxsfnwvz.s3.ap-southeast-1.amazonaws.com/images/footer.png';

    return `
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 40px;">
                        <tr>
                            <td width="80" style="padding-right: 15px; vertical-align: top;">
                                <img src="${footerImagePath}" alt="No Filter Finance" style="width: 80px; height: auto; max-width: 100%; padding-top: 8px">
                            </td>
                            <td style="vertical-align: top; padding-top: 0px; border-top: 1px solid #ddd;">
                                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                                    <tr>
                                        <td style="color: #9ca3af; line-height: 1.4; font-size: 12px; font-family: Arial, sans-serif; text-align: left; padding-top: 8px;">© 2025 No Filter Finance. All rights reserved. This content does not constitute investment advice. Any action taken based on this content is at the sole responsibility of the user.</td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>`;
  }
}
