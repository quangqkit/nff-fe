import { Injectable, Logger } from '@nestjs/common';
import { ChartImageService } from './chart-image.service';

@Injectable()
export class PdfHtmlGeneratorService {
  private readonly logger = new Logger(PdfHtmlGeneratorService.name);

  constructor(private readonly chartImageService: ChartImageService) {}

  async generateHtmlForPdf(report: any): Promise<string> {
    const sections = report.sections || [];
    let html = this.getHtmlHeader(report);

    html += this.generateCoverPage(report);
    this.logger.log('Cover page generated');

    html += await this.generateMainContent(report, sections);
    html += `</body>\n</html>`;

    this.logger.log(`Final HTML length: ${html.length} characters`);
    return html;
  }

  private async generateMainContent(
    report: any,
    sections: any[],
  ): Promise<string> {
    if (sections.length === 0) {
      return '';
    }

    let content = `
      <!-- Main Content Starts Here -->
      <div style="margin-top: 20px; padding-top: 10px;">
        <div class="header">
          <h1>${this.escapeHtml(report.title)}</h1>
        </div>
    `;

    const chartBlocks: any[] = [];
    for (const section of sections) {
      for (const block of section.blocks || []) {
        if (block.type === 'CHART') {
          chartBlocks.push(block);
        }
      }
    }

    let chartImageMap = new Map<number, any>();
    if (chartBlocks.length > 0) {
      this.logger.log(
        `Generating ${chartBlocks.length} chart images in parallel`,
      );
      chartImageMap =
        await this.chartImageService.generateChartImagesFromBlocks(chartBlocks);
    }

    for (const section of sections) {
      content += await this.generateSectionHtml(section, chartImageMap);
    }

    content += `</div>`;
    return content;
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
            padding: 0;
            background-color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #707FDD;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin: 0;
            font-size: 28px;
        }
        .header .date {
            color: #666;
            font-size: 14px;
            margin-top: 10px;
        }
        .section {
            margin-bottom: 20px;
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
            margin-bottom: 15px;
            page-break-inside: avoid;
            break-inside: avoid;
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
        .cover-page {
            min-height: 80vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 20px;
            background: white;
            margin-bottom: 20px;
        }
        .cover-header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
        }
        .cover-logo {
            width: 200px;
            height: auto;
        }
        .cover-logo-text {
            font-family: "Zalando Sans Expanded", sans-serif;
            font-weight: bold;
            font-size: 16px;
            color: #000000;
            line-height: 1.1;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            text-align: left;
        }
        .cover-logo-text .logo-line {
            display: block;
            margin: 0;
            padding: 0;
        }
        .cover-title-section {
            text-align: center;
            margin-bottom: 10px;
        }
        .cover-title {
            font-size: 48px;
            font-weight: bold;
            color: #1e293b;
            margin: 0 0 20px 0;
            line-height: 1.1;
        }
        .cover-date {
            font-size: 18px;
            color: #64748b;
            margin: 0;
        }
        .cover-content {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        /* Morning Brief (Type 1) - Vibrant Blue Design */
        .blue-blocks-morning-brief {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            background: #2196F3; /* Vibrant blue - Main layer */
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(33, 150, 243, 0.3);
            color: white;
            box-sizing: border-box;
            position: relative;
            z-index: 3;
            transform: translateX(0); /* Main card position */
        }
        
        /* Layer 1: First background layer (same size, shifted right) */
        .blue-blocks-morning-brief::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 600px;
            height: 400px;
            background: rgba(33, 150, 243, 0.7); /* Semi-transparent blue */
            border-radius: 20px;
            z-index: -1;
            transform: translateX(-15px) translateY(-15px); /* Shift to the left and up */
        }
        
        /* Layer 2: Second background layer (same size, shifted more right) */
        .blue-blocks-morning-brief::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 600px;
            height: 400px;
            background: rgba(33, 150, 243, 0.4); /* More transparent blue */
            border-radius: 20px;
            z-index: -2;
            transform: translateX(-30px) translateY(-30px); /* Shift more to the left and up */
        }

        /* Weekly Tactical Review (Type 2) - Purple Theme */
        .blue-blocks-weekly-tactical {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            background: #8B5CF6; /* Vibrant purple - Main layer */
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3);
            color: white;
            box-sizing: border-box;
            position: relative;
            z-index: 3;
            transform: translateX(0); /* Main card position */
        }
        
        /* Layer 1: First background layer (same size, shifted right) */
        .blue-blocks-weekly-tactical::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 600px;
            height: 400px;
            background: rgba(139, 92, 246, 0.7); /* Semi-transparent purple */
            border-radius: 20px;
            z-index: -1;
            transform: translateX(-15px) translateY(-15px); /* Shift to the left and up */
        }
        
        /* Layer 2: Second background layer (same size, shifted more right) */
        .blue-blocks-weekly-tactical::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 600px;
            height: 400px;
            background: rgba(139, 92, 246, 0.4); /* More transparent purple */
            border-radius: 20px;
            z-index: -2;
            transform: translateX(-30px) translateY(-30px); /* Shift more to the left and up */
        }

        /* Global Macro (Type 4) - Gray Background with Wave Border */
        .cover-page-global-macro {
            background: #F5F5F5; /* Light gray background */
        }
        .blue-blocks-global-macro {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            background: #F8F9FA; /* Very light gray */
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            color: #333; /* Dark gray text */
            box-sizing: border-box;
            position: relative;
            border: 2px solid #E9ECEF;
        }
        .blue-blocks-global-macro::before {
            content: '';
            position: absolute;
            top: -15px;
            right: -15px;
            width: 200px;
            height: 430px;
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); /* Purple wave */
            border-radius: 50px;
            z-index: -1;
            transform: rotate(5deg);
        }
        .blue-blocks-global-macro::after {
            content: '';
            position: absolute;
            top: -25px;
            right: -25px;
            width: 220px;
            height: 450px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.6) 0%, rgba(124, 58, 237, 0.6) 100%);
            border-radius: 60px;
            z-index: -2;
            transform: rotate(5deg);
        }

        /* Sector Weekly (Type 3) - 4 Corner Design with White Background */
        .cover-page-sector-weekly {
            background: white; /* White background for cover page */
            position: relative;
        }
        .blue-blocks-sector-weekly {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            background: #E5E7EB; /* Gray card background */
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            color: #333; /* Dark gray text */
            box-sizing: border-box;
            position: relative;
            border: 2px solid #D1D5DB;
            z-index: 2;
        }

        /* Legacy support for existing blue-blocks class */
        .blue-blocks {
            width: 600px;
            height: 400px;
            margin: 20px auto;
            background: linear-gradient(135deg, #707FDD 0%, #6366f1 100%);
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
            color: white;
            box-sizing: border-box;
        }
        .author-info {
            margin-bottom: 30px;
        }
        .author-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .author-title {
            font-size: 16px;
            margin: 0;
        }
        .report-description {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
            position: relative;
        }
        .report-description strong {
            font-weight: bold;
        }
        .cta-text {
            font-size: 18px;
            font-weight: 500;
            font-weight: bold;
        }
        .page-break {
            page-break-before: always;
            height: 0;
            overflow: hidden;
        }
        .section {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .chart-container {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .cover-page {
            page-break-after: always;
        }
        @media (max-width: 600px) {
            .container {
                padding: 15px;
            }
            .header h1 {
                font-size: 24px;
            }
            table {
                font-size: 14px;
            }
            .cover-page {
                padding: 20px;
            }
            .cover-title {
                font-size: 36px;
            }
            .blue-blocks,
            .blue-blocks-morning-brief,
            .blue-blocks-weekly-tactical,
            .blue-blocks-global-macro,
            .blue-blocks-sector-weekly {
                width: 100%;
                height: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="container">`;
  }

  private generateCoverPage(report: any): string {
    const currentDate = this.formatDateWithOrdinal(new Date());

    const reportType = this.getReportTypeFromReport(report);
    const coverPageConfig = this.getCoverPageConfig(reportType);

    return `
        <div class="cover-page ${coverPageConfig.pageClass}">
            <div class="cover-header">
                <div class="cover-logo-text">
                    <span class="logo-line">NO</span>
                    <span class="logo-line">FILTER</span>
                    <span class="logo-line">FINANCE</span>
                </div>
            </div>
            
            <div class="cover-title-section">
                <h1 class="cover-title">${this.escapeHtml(report.title)}</h1>
                <p class="cover-date">${currentDate}</p>
            </div>
            
            <div class="cover-content">
                <div class="${coverPageConfig.contentBlockClass}">
                    <div class="author-info">
                        <h2 class="author-name">Idan Gez</h2>
                        <p class="author-title">NFF Founder</p>
                    </div>
                    <div class="report-description">
                        ${report.summary ? this.escapeHtml(report.summary) : 'This report provides comprehensive analysis and insights into current market conditions and trends.'}
                    </div>
                    <p class="cta-text">Let's get into it.</p>
                </div>
            </div>
        </div>`;
  }

  private getReportTypeFromReport(report: any): string {
    this.logger.log('Debug: Report object structure:', {
      hasReportType: !!report.reportType,
      reportTypeName: report.reportType?.name,
      title: report.title,
      keys: Object.keys(report),
    });

    // Try to get report type from various sources
    if (report.reportType?.name) {
      this.logger.log('Using reportType.name:', report.reportType.name);
      return report.reportType.name;
    }
    if (report.title) {
      this.logger.log('Using title as report type:', report.title);
      return report.title;
    }
    this.logger.log('Using default fallback: Morning Brief');
    return 'Morning Brief'; // Default fallback
  }

  private getCoverPageConfig(reportType: string): {
    pageClass: string;
    contentBlockClass: string;
  } {
    const normalizedType = reportType.toLowerCase();
    this.logger.log('Debug: Processing report type:', {
      reportType,
      normalizedType,
    });

    if (normalizedType.includes('morning brief')) {
      this.logger.log('Matched Morning Brief design');
      return {
        pageClass: 'cover-page-morning-brief',
        contentBlockClass: 'blue-blocks-morning-brief',
      };
    } else if (normalizedType.includes('weekly tactical review')) {
      this.logger.log('Matched Weekly Tactical Review design');
      return {
        pageClass: 'cover-page-weekly-tactical',
        contentBlockClass: 'blue-blocks-weekly-tactical',
      };
    } else if (normalizedType.includes('global macro')) {
      this.logger.log('Matched Global Macro design');
      return {
        pageClass: 'cover-page-global-macro',
        contentBlockClass: 'blue-blocks-global-macro',
      };
    } else if (normalizedType.includes('sector weekly')) {
      this.logger.log('Matched Sector Weekly design');
      return {
        pageClass: 'cover-page-sector-weekly',
        contentBlockClass: 'blue-blocks-sector-weekly',
      };
    } else {
      // Default to Morning Brief
      this.logger.log('Using default Morning Brief design for:', reportType);
      return {
        pageClass: 'cover-page-morning-brief',
        contentBlockClass: 'blue-blocks-morning-brief',
      };
    }
  }

  private async generateSectionHtml(
    section: any,
    chartImageMap: Map<number, any> = new Map(),
  ): Promise<string> {
    const blocks = section.blocks || [];
    if (blocks.length === 0) {
      return '';
    }

    let html = `
        <div class="section">
            <h2>${this.escapeHtml(section.title)}</h2>`;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      // Add page break before every 3rd block to prevent content overflow
      if (i > 0 && i % 3 === 0) {
        html += `<div class="page-break"></div>`;
      }

      html += await this.generateBlockHtml(block, chartImageMap);
    }

    html += `
        </div>`;

    return html;
  }

  private async generateBlockHtml(
    block: any,
    chartImageMap: Map<number, any> = new Map(),
  ): Promise<string> {
    switch (block.type) {
      case 'TEXT':
        return this.generateTextBlockHtml(block);
      case 'CHART':
        return this.generateChartBlockHtml(block, chartImageMap);
      case 'TABLE':
        return this.generateTableBlockHtml(block);
      case 'BULLETS':
        return this.generateBulletsBlockHtml(block);
      case 'NOTES':
        return this.generateNotesBlockHtml(block);
      default:
        return `<!-- Unknown block type: ${block.type} -->`;
    }
  }

  private generateTextBlockHtml(block: any): string {
    const content = block.content?.richText || block.content?.plainText || '';

    return `
            <div class="block">
                <h3><span class="dot"></span>${this.escapeHtml(block.name)}</h3>
                <div class="text-content">${this.formatTextContent(content)}</div>
            </div>`;
  }

  private generateChartBlockHtml(
    block: any,
    chartImageMap: Map<number, any> = new Map(),
  ): string {
    const title = block.content?.chartTitle || block.name;

    let html = `
            <div class="block">
                <h3>${this.escapeHtml(title)}</h3>
                <div class="chart-container">`;

    try {
      if (
        block.content?.chartData &&
        block.content.chartData.datasets?.length > 0
      ) {
        // Use pre-generated chart image from map
        const chartImageResult = chartImageMap.get(block.id);

        if (chartImageResult) {
          const imageSrc =
            chartImageResult.storageUrl ||
            this.getRelativeImagePath(chartImageResult.filePath);
          html += `<img src="${this.escapeHtml(imageSrc)}" alt="${this.escapeHtml(title)}" style="max-width: 100%; height: auto;">`;

          if (chartImageResult.storageUrl) {
            this.logger.log(
              `Using chart image with storage URL for block ${block.id}: ${chartImageResult.storageUrl}`,
            );
          } else {
            this.logger.log(
              `Using chart image for block ${block.id}: ${chartImageResult.filePath}`,
            );
          }
        } else {
          html += `<p><em>Failed to generate chart image</em></p>`;
        }
      } else {
        html += `<p><em>Chart data not available</em></p>`;
      }
    } catch (error) {
      this.logger.error(
        `Failed to generate chart for block ${block.id}: ${error.message}`,
      );
      html += `<p><em>Chart generation failed</em></p>`;
    }

    html += `
                </div>
            </div>`;

    return html;
  }

  private generateTableBlockHtml(block: any): string {
    const headers = block.content?.headers || [];
    const rows = block.content?.rows || [];

    if (headers.length === 0 || rows.length === 0) {
      return `
            <div class="block">
                <h3>${this.escapeHtml(block.name)}</h3>
                <p><em>No table data available</em></p>
            </div>`;
    }

    let html = `
            <div class="block">
                <h3>${this.escapeHtml(block.name)}</h3>
                <table>
                    <thead>
                        <tr>`;

    for (const header of headers) {
      html += `<th>${this.escapeHtml(header)}</th>`;
    }

    html += `
                        </tr>
                    </thead>
                    <tbody>`;

    for (const row of rows) {
      html += `<tr>`;
      for (const cell of row) {
        html += `<td>${this.escapeHtml(String(cell))}</td>`;
      }
      html += `</tr>`;
    }

    html += `
                    </tbody>
                </table>
            </div>`;

    return html;
  }

  private generateBulletsBlockHtml(block: any): string {
    const bullets = block.content?.bullets || [];

    if (bullets.length === 0) {
      return `
            <div class="block">
                <h3>${this.escapeHtml(block.name)}</h3>
                <p><em>No bullet points available</em></p>
            </div>`;
    }

    let html = `
            <div class="block">
                <h3>${this.escapeHtml(block.name)}</h3>
                <ul>`;

    for (const bullet of bullets) {
      const indent = '&nbsp;'.repeat((bullet.level || 0) * 20);
      html += `<li>${indent}${this.escapeHtml(bullet.text)}</li>`;
    }

    html += `
                </ul>
            </div>`;

    return html;
  }

  private generateNotesBlockHtml(block: any): string {
    const noteText = block.content?.noteText || '';
    const noteType = block.content?.noteType || 'info';

    return `
            <div class="block">
                <h3>${this.escapeHtml(block.name)}</h3>
                <div class="note ${noteType}">
                    ${this.formatTextContent(noteText)}
                </div>
            </div>`;
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
}
