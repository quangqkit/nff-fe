import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { ClassifyTweetsDto } from '../dto/classify-tweets.dto';
import { UpdateTweetCategoriesDto } from '../dto/update-tweet-categories.dto';
import { GetTweetsQueryDto } from '../dto/get-tweets-query.dto';
import {
  ClassifyTweetsResponse,
  TweetResponse,
  GetTweetsResponse,
} from '../types/tweet.types';
import { PrismaService } from './prisma.service';

@Injectable()
export class TweetClassificationService {
  private readonly logger = new Logger(TweetClassificationService.name);
  private readonly dataIngestionServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.dataIngestionServiceUrl =
      this.configService.get<string>('DATA_INGESTION_SERVICE_URL') ||
      this.configService.get<string>('PYTHON_SERVICE_URL') ||
      process.env.PYTHON_SERVICE_URL ||
      'http://localhost:8000';
  }

  async classify(dto: ClassifyTweetsDto): Promise<ClassifyTweetsResponse> {
    const tweetIds: string[] = [];

    if (dto.tweetId) {
      tweetIds.push(dto.tweetId);
    }

    if (dto.id) {
      const tweetRaw = await this.prisma.tweetRaw.findUnique({
        where: { id: dto.id },
        select: { tweetId: true },
      });
      if (!tweetRaw) {
        throw new BadRequestException(`TweetRaw with id ${dto.id} not found`);
      }
      tweetIds.push(tweetRaw.tweetId);
    }

    if (dto.tweetIds && dto.tweetIds.length > 0) {
      tweetIds.push(...dto.tweetIds);
    }

    if (dto.ids && dto.ids.length > 0) {
      const tweetRaws = await this.prisma.tweetRaw.findMany({
        where: { id: { in: dto.ids } },
        select: { tweetId: true },
      });
      if (tweetRaws.length !== dto.ids.length) {
        throw new BadRequestException('Some TweetRaw ids not found');
      }
      tweetIds.push(...tweetRaws.map((tr) => tr.tweetId));
    }

    if (tweetIds.length === 0) {
      throw new BadRequestException(
        'Must provide tweetId, id, tweetIds, or ids',
      );
    }

    const uniqueTweetIds = [...new Set(tweetIds)];

    const payload: Record<string, unknown> = {
      tweetIds: uniqueTweetIds,
    };

    if (dto.prompt) {
      payload.prompt = dto.prompt;
      this.logger.log(`Using custom prompt for classification`);
    }

    const url = `${this.dataIngestionServiceUrl.replace(/\/$/, '')}/api/v1/tweets/classify`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ count: number; items: any[] }>(url, payload, {
          timeout: 600000,
        }),
      );

      const classified = response.data.items || [];
      const tweets: TweetResponse[] = classified.map((item) => ({
        id: 0,
        tweetId: item.tweet_id,
        categories: item.categories || [],
        subCategories: item.sub_categories || null,
        tickers: item.tickers || [],
        sectors: item.sectors || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return {
        count: tweets.length,
        items: tweets,
      };
    } catch (error: any) {
      const status = error?.response?.status ?? 500;
      const detail = error?.response?.data?.detail || error.message;
      this.logger.error(`Tweet classification request failed: ${detail}`);
      throw new HttpException(detail, status);
    }
  }

  async classifyByRunId(runId: string): Promise<void> {
    let tweetRaws = await this.prisma.tweetRaw.findMany({
      where: { runId },
      select: { tweetId: true },
    });

    if (tweetRaws.length === 0) {
      const existingTweets = await this.prisma.$queryRaw<
        Array<{ tweetId: string }>
      >`
        SELECT "tweetId" FROM "Tweet"
      `;
      const classifiedTweetIds = new Set(existingTweets.map((t) => t.tweetId));

      const allTweetRaws = await this.prisma.tweetRaw.findMany({
        select: { tweetId: true },
        take: 100,
        orderBy: { fetchedAt: 'desc' },
      });

      tweetRaws = allTweetRaws.filter(
        (tr) => !classifiedTweetIds.has(tr.tweetId),
      );

      if (tweetRaws.length === 0) {
        return;
      }
    }

    const tweetIds = tweetRaws.map((tr) => tr.tweetId);
    const payload = {
      tweetIds,
    };

    const url = `${this.dataIngestionServiceUrl.replace(/\/$/, '')}/api/v1/tweets/classify`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<{ count: number; items: any[] }>(url, payload, {
          timeout: 600000,
        }),
      );
    } catch (error: any) {
      const detail = error?.response?.data?.detail || error.message;
      this.logger.error(
        `Failed to classify tweets for runId ${runId}: ${detail}`,
      );
      throw new HttpException(detail, error?.response?.status ?? 500);
    }
  }

  async updateCategories(
    tweetId: string,
    dto: UpdateTweetCategoriesDto,
  ): Promise<TweetResponse> {
    const tweet = await this.prisma.tweet.findUnique({
      where: { tweetId },
    });

    if (!tweet) {
      throw new NotFoundException(`Tweet with tweetId ${tweetId} not found`);
    }

    if (!dto.categories && !dto.subCategories) {
      throw new BadRequestException(
        'At least one of categories or subCategories must be provided',
      );
    }

    const updateData: {
      categories?: string[];
      subCategories?: any;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (dto.categories !== undefined) {
      updateData.categories = dto.categories;
    }

    if (dto.subCategories !== undefined) {
      updateData.subCategories = dto.subCategories;
    }

    const updated = await this.prisma.tweet.update({
      where: { tweetId },
      data: updateData,
    });

    return {
      id: updated.id,
      tweetId: updated.tweetId,
      categories: updated.categories,
      subCategories: updated.subCategories as Record<string, string[]> | null,
      tickers: updated.tickers,
      sectors: updated.sectors,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  getCategoriesReference(): Record<string, string[]> {
    return {
      Company: [
        'Earnings',
        'Guidance',
        'Analysts Rating',
        'M&A',
        'Capital Actions',
        'Management & Board',
        'Product / Technology',
        'Partnership / Contracts',
        'Legal / Compliance',
        'Operations / KPIs',
      ],
      'Macro & Economy': [
        'Central Banks',
        'Inflation',
        'Labor',
        'Growth / Activity',
        'Fiscal / Policy',
        'Trade / Geopolitics',
        'Housing',
      ],
      'Market Structure & Flows': [
        'Options & Gamma',
        'CTA / Systematic',
        'ETF & Index',
        'Short Interest',
        'Dark Pools / Block Trades',
        'Fund Flows',
        'Insider Transactions',
      ],
      'Commodities, FX & Crypto': [
        'Oil & Gas',
        'Metals / Agriculture',
        'FX / Rates',
        'Crypto',
      ],
      'Technical & Market Dynamics': [
        'Breakouts / Levels',
        'Volatility',
        'Breadth / Momentum',
        'Seasonality / Patterns',
      ],
      'Data & Sentiment': ['Alt-Data', 'Surveys / Sentiment', 'Media / PR'],
    };
  }

  async getTweets(dto: GetTweetsQueryDto): Promise<GetTweetsResponse> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    // Filter by categories
    if (dto.categories && dto.categories.length > 0) {
      where.categories = {
        hasSome: dto.categories,
      };
    }

    // Filter by date range
    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) {
        where.createdAt.gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        where.createdAt.lte = new Date(dto.endDate);
      }
    }

    // Search in tickers or sectors
    if (dto.search && dto.search.trim() !== '') {
      const searchTerm = dto.search.trim();
      where.OR = [
        {
          tickers: {
            has: searchTerm,
          },
        },
        {
          sectors: {
            has: searchTerm,
          },
        },
      ];
    }

    // Optimized: If subCategories filter is used, we need to filter in memory
    // Otherwise, use standard Prisma query with pagination at DB level
    if (dto.subCategories && dto.subCategories.length > 0) {
      // Fetch all matching tweets (with other filters applied)
      const allTweets = await this.prisma.tweet.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Apply subCategories filter in memory
      const filteredTweets = allTweets.filter((tweet) => {
        if (!tweet.subCategories) return false;
        const subCats = tweet.subCategories as Record<string, string[]>;
        // Check if any of the requested sub-categories exists in any category
        return dto.subCategories!.some((searchSubCat) => {
          return Object.values(subCats).some((subCatArray) =>
            subCatArray.includes(searchSubCat),
          );
        });
      });

      const total = filteredTweets.length;
      const totalPages = Math.ceil(total / pageSize);

      // Apply pagination
      const paginatedTweets = filteredTweets.slice(skip, skip + pageSize);

      const items: TweetResponse[] = paginatedTweets.map((tweet) => ({
        id: tweet.id,
        tweetId: tweet.tweetId,
        categories: tweet.categories,
        subCategories: tweet.subCategories as Record<string, string[]> | null,
        tickers: tweet.tickers,
        sectors: tweet.sectors,
        createdAt: tweet.createdAt,
        updatedAt: tweet.updatedAt,
      }));

      return {
        data: items,
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      };
    }

    // No subCategories filter - use standard Prisma query (optimized with DB-level pagination)
    const [tweets, total] = await Promise.all([
      this.prisma.tweet.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.tweet.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const items: TweetResponse[] = tweets.map((tweet) => ({
      id: tweet.id,
      tweetId: tweet.tweetId,
      categories: tweet.categories,
      subCategories: tweet.subCategories as Record<string, string[]> | null,
      tickers: tweet.tickers,
      sectors: tweet.sectors,
      createdAt: tweet.createdAt,
      updatedAt: tweet.updatedAt,
    }));

    return {
      data: items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}
