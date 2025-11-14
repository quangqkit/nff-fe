import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { ClassifyTweetsDto } from '../dto/classify-tweets.dto';
import {
  ClassifyTweetsResponse,
  TweetCategory,
  TweetResponse,
} from '../types/tweet.types';
import { PrismaService } from './prisma.service';

@Injectable()
export class TweetClassificationService {
  private readonly logger = new Logger(TweetClassificationService.name);
  private readonly dataIngestionServiceUrl: string;
  private readonly categoryMap: Map<string, TweetCategory>;

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

    this.categoryMap = new Map<string, TweetCategory>([
      ['macro', 'Macro'],
      ['sector', 'Sector'],
      ['earnings', 'Earnings'],
      ['analyst', 'Analyst'],
      ['analyst rating', 'Analyst'],
      ['corporate', 'Corporate'],
      ['corporate/regulatory', 'Corporate'],
      ['corporate_regulatory', 'Corporate'],
      ['regulatory', 'Corporate'],
      ['options', 'Options'],
      ['flows', 'Options'],
      ['flows/options', 'Options'],
    ]);
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
        category: this.normalizeCategory(item.category),
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

  async changeCategory(tweetId: string, category: string): Promise<void> {
    const normalizedCategory = this.normalizeCategory(category);

    const tweet = await this.prisma.tweet.findUnique({
      where: { tweetId },
    });

    if (!tweet) {
      throw new BadRequestException(`Tweet with id ${tweetId} not found`);
    }

    await this.prisma.tweet.update({
      where: { tweetId },
      data: {
        tickers: [],
        sectors: [],
        updatedAt: new Date(),
      },
    });
  }

  private normalizeCategory(raw: string): TweetCategory {
    if (!raw) {
      throw new InternalServerErrorException('Classifier omitted category');
    }
    const normalized = raw.trim().toLowerCase();
    const mapped = this.categoryMap.get(normalized);
    if (!mapped) {
      throw new InternalServerErrorException(
        `Classifier returned unsupported category: ${raw}`,
      );
    }
    return mapped;
  }
}
