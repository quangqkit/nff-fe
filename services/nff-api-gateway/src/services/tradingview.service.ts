import { Injectable } from '@nestjs/common';
import puppeteer, { Page } from 'puppeteer';
import { TradingViewDto } from '../dto/tradingview.dto';
import { PrismaService } from './prisma.service';

@Injectable()
export class TradingViewService {
  private readonly URLS = {
    gainers:
      'https://www.tradingview.com/markets/stocks-usa/market-movers-pre-market-gainers/',
    losers:
      'https://www.tradingview.com/markets/stocks-usa/market-movers-pre-market-losers/',
  };

  constructor(private readonly prisma: PrismaService) {}

  private parseMarketCap(str: string): number {
    if (!str) return 0;
    const match = str.match(/([\d.]+)\s*([MBT])\s*USD/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    const factor =
      unit === 'B' ? 1e9 : unit === 'M' ? 1e6 : unit === 'T' ? 1e12 : 1;
    return num * factor;
  }

  private async autoScroll(page: Page): Promise<void> {
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 300);
      });
    });
  }

  private getTodayStart(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private getTodayEnd(): Date {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }

  private async hasDataForToday(
    dataType: 'gainers' | 'losers',
  ): Promise<boolean> {
    const count = await this.prisma.tradingViewStock.count({
      where: {
        dataType: dataType,
        fetchTime: {
          gte: this.getTodayStart(),
          lte: this.getTodayEnd(),
        },
      },
    });
    return count > 0;
  }

  private async getDataFromDb(
    dataType: 'gainers' | 'losers',
  ): Promise<TradingViewDto[]> {
    const stocks = await this.prisma.tradingViewStock.findMany({
      where: {
        dataType: dataType,
        fetchTime: {
          gte: this.getTodayStart(),
          lte: this.getTodayEnd(),
        },
      },
      orderBy: {
        fetchTime: 'desc',
      },
    });

    return stocks.map((stock) => ({
      symbol: stock.symbol,
      companyName: stock.companyName,
      preMarketChangePercent: stock.preMarketChangePercent || '',
      marketCap: stock.marketCap || '',
    }));
  }

  private async scrapeTradingView(url: string): Promise<TradingViewDto[]> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );
      await page.goto(url, { waitUntil: 'networkidle2' });

      await this.autoScroll(page);
      await new Promise((res) => setTimeout(res, 2000));

      await page.waitForSelector('tbody', { timeout: 60000 });

      const stocks: TradingViewDto[] = await page.evaluate(() => {
        const results: TradingViewDto[] = [];
        const rows = document.querySelectorAll('tbody > tr');

        rows.forEach((row) => {
          const tds = row.querySelectorAll('td');
          if (tds.length < 10) return;

          const dataRowKey = row.getAttribute('data-rowkey') || '';
          const symbol = (
            dataRowKey.includes(':') ? dataRowKey.split(':')[1] : dataRowKey
          ).trim();
          const companyName = tds[0].textContent?.trim().split('\n')[0] || '';
          const preMarketChangePercent = tds[1].textContent?.trim() || '';
          const marketCap = tds[9].textContent?.trim() || '';

          results.push({
            symbol,
            companyName,
            preMarketChangePercent,
            marketCap,
          });
        });

        return results;
      });

      const filtered = stocks.filter((s) => {
        const cap = this.parseMarketCap(s.marketCap);
        return cap >= 1.5e9;
      });

      await browser.close();
      return filtered;
    } catch (err) {
      await browser.close();
      throw err;
    }
  }

  private async storeTradingViewStocks(
    stocks: TradingViewDto[],
    dataType: 'gainers' | 'losers',
  ): Promise<void> {
    const fetchTime = new Date();

    await this.prisma.tradingViewStock.deleteMany({
      where: { dataType: dataType },
    });

    for (const stock of stocks) {
      await this.prisma.tradingViewStock.create({
        data: {
          symbol: stock.symbol,
          companyName: stock.companyName,
          preMarketChangePercent: stock.preMarketChangePercent,
          marketCap: stock.marketCap,
          source: 'TradingView',
          dataType: dataType,
          fetchTime: fetchTime,
        },
      });
    }
  }

  async getTradingViewData(
    dataType: 'gainers' | 'losers',
  ): Promise<TradingViewDto[]> {
    try {
      const hasData = await this.hasDataForToday(dataType);
      if (hasData) {
        return await this.getDataFromDb(dataType);
      }

      const url = this.URLS[dataType];
      const stocks = await this.scrapeTradingView(url);
      await this.storeTradingViewStocks(stocks, dataType);
      return stocks;
    } catch (error) {
      throw new Error(`Failed to get ${dataType} data: ${error.message}`);
    }
  }

  async getTradingViewDataFromDb(
    dataType: 'gainers' | 'losers',
  ): Promise<TradingViewDto[]> {
    return await this.getDataFromDb(dataType);
  }

  async getSymbolsFromDb(
    dataType: 'gainers' | 'losers',
  ): Promise<string[]> {
    const stocks = await this.prisma.tradingViewStock.findMany({
      where: {
        dataType: dataType,
        fetchTime: {
          gte: this.getTodayStart(),
          lte: this.getTodayEnd(),
        },
      },
      select: {
        symbol: true,
      },
    });

    const uniqueSymbols = Array.from(
      new Set(stocks.map((stock) => stock.symbol)),
    ).sort();

    return uniqueSymbols;
  }

  async searchByName(
    dataType: 'gainers' | 'losers',
    name: string,
  ): Promise<TradingViewDto[]> {
    const stocks = await this.prisma.tradingViewStock.findMany({
      where: {
        dataType: dataType,
        fetchTime: {
          gte: this.getTodayStart(),
          lte: this.getTodayEnd(),
        },
        companyName: {
          contains: name,
          mode: 'insensitive',
        },
      },
      orderBy: {
        fetchTime: 'desc',
      },
    });

    return stocks.map((stock) => ({
      symbol: stock.symbol,
      companyName: stock.companyName,
      preMarketChangePercent: stock.preMarketChangePercent || '',
      marketCap: stock.marketCap || '',
    }));
  }
}
