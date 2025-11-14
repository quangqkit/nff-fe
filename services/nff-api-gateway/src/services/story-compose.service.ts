import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from './prisma.service';
import { StoryService } from './story.service';
import { StoryStatus } from '@prisma/client';

@Injectable()
export class StoryComposeService {
  private readonly logger = new Logger(StoryComposeService.name);
  private readonly openaiApiUrl: string;
  private readonly openaiApiKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storyService: StoryService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiApiUrl =
      this.configService.get<string>('DATA_INGESTION_SERVICE_URL') ||
      this.configService.get<string>('PYTHON_SERVICE_URL') ||
      'http://localhost:8000';
  }

  async composeStory(storyId: number): Promise<{ composedText: string }> {
    const story = await this.storyService.getStoryById(storyId);

    if (!story) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }

    const tweetItems =
      story.type === 'TICKER' ? story.tickerItems : story.sectorItems;

    if (tweetItems.length === 0) {
      throw new NotFoundException(`Story ${storyId} has no tweets`);
    }

    const tweetIds = tweetItems.map((item) => item.tweet.tweetId);
    const tweetRaws = await this.prisma.tweetRaw.findMany({
      where: { tweetId: { in: tweetIds } },
      select: {
        tweetId: true,
        text: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const tweetSnippets = tweetRaws
      .map((t) => `- ${t.text.substring(0, 200)}...`)
      .join('\n');

    const categories = story.categories.join(', ');
    const identifier = story.type === 'TICKER' ? story.ticker : story.sector;

    const prompt = this.buildPrompt(
      story.type,
      identifier as string,
      tweetSnippets,
      categories,
    );

    const composedText = await this.callLLM(prompt);

    await this.prisma.story.update({
      where: { id: storyId },
      data: {
        composedText,
        status: StoryStatus.COMPOSED,
        updatedAt: new Date(),
      },
    });

    return { composedText };
  }

  async composeStoriesBatch(
    storyIds?: number[],
    runId?: string,
  ): Promise<{ composed: number; failed: number }> {
    let stories;
    if (storyIds && storyIds.length > 0) {
      stories = await this.prisma.story.findMany({
        where: {
          id: { in: storyIds },
          status: { not: StoryStatus.COMPOSED },
        },
      });
    } else if (runId) {
      stories = await this.prisma.story.findMany({
        where: {
          runId,
          status: { not: StoryStatus.COMPOSED },
        },
      });
    } else {
      stories = await this.prisma.story.findMany({
        where: {
          status: StoryStatus.GROUPED,
        },
        take: 50,
      });
    }

    let composed = 0;
    let failed = 0;

    for (const story of stories) {
      try {
        await this.composeStory(story.id);
        composed++;
      } catch (error) {
        this.logger.error(
          `[COMPOSE] Failed to compose story ${story.id}: ${error.message}`,
        );
        failed++;
      }
    }

    return { composed, failed };
  }

  private buildPrompt(
    type: 'TICKER' | 'SECTOR',
    identifier: string,
    tweetSnippets: string,
    categories: string,
  ): string {
    const tickerOrSector = type === 'TICKER' ? 'TICKER' : 'SECTOR';
    const value = identifier;

    return `TASK: Summarize what matters for trading today.
2-6 sentences, depending on available unique information.
Avoid repeating identical points; collapse duplicates.

${tickerOrSector}: ${value}
TWEETS:
${tweetSnippets}
CONTEXT: Categories seen: ${categories}

OUTPUT: Plain English text only.`;
  }

  private async callLLM(prompt: string): Promise<string> {
    try {
      const url = `${this.openaiApiUrl.replace(/\/$/, '')}/api/v1/stories/compose`;
      const response = await firstValueFrom(
        this.httpService.post<{ text: string }>(
          url,
          { prompt },
          {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data.text;
    } catch {
      this.logger.warn(
        `Data ingestion service compose endpoint not available, using direct OpenAI`,
      );
    }

    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openaiUrl = 'https://api.openai.com/v1/chat/completions';
    const response = await firstValueFrom(
      this.httpService.post(
        openaiUrl,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a financial news summarizer. Generate concise, trading-relevant summaries. Avoid repetition and collapse duplicates.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          timeout: 60000,
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    const text = response.data.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error('Empty response from OpenAI');
    }

    return text;
  }
}
