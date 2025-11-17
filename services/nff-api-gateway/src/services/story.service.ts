import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { StoryType, StoryStatus } from '@prisma/client';

export interface StoryGroupingResult {
  tickerStories: number;
  sectorStories: number;
  totalTweetsGrouped: number;
}

@Injectable()
export class StoryService {
  private readonly logger = new Logger(StoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async groupTweetsIntoStories(
    runId?: string,
    scheduleId?: string,
  ): Promise<StoryGroupingResult> {
    const whereClause: any = {
      OR: [{ tickers: { isEmpty: false } }, { sectors: { isEmpty: false } }],
    };

    if (runId) {
      const tweetRaws = await this.prisma.tweetRaw.findMany({
        where: { runId },
        select: { tweetId: true },
      });
      const tweetIds = tweetRaws.map((tr) => tr.tweetId);
      whereClause.tweetId = { in: tweetIds };
    }

    const tweets = await this.prisma.tweet.findMany({
      where: whereClause,
      select: {
        tweetId: true,
        categories: true,
        tickers: true,
        sectors: true,
      },
    });

    let tickerStories = 0;
    let sectorStories = 0;
    const processedTweetIds = new Set<string>();

    const tickerGroups = new Map<
      string,
      { tweets: Set<string>; categories: Set<string> }
    >();
    const sectorGroups = new Map<
      string,
      { tweets: Set<string>; categories: Set<string> }
    >();

    for (const tweet of tweets) {
      const hasTickers = tweet.tickers && tweet.tickers.length > 0;
      const hasSectors = tweet.sectors && tweet.sectors.length > 0;

      if (!hasTickers && !hasSectors) {
        continue;
      }

      if (hasTickers) {
        for (const ticker of tweet.tickers) {
          if (!ticker || !ticker.trim()) continue;

          const tickerKey = ticker.trim().toUpperCase();
          if (!tickerGroups.has(tickerKey)) {
            tickerGroups.set(tickerKey, {
              tweets: new Set(),
              categories: new Set(),
            });
          }
          const group = tickerGroups.get(tickerKey)!;
          group.tweets.add(tweet.tweetId);
          // Add all categories from tweet
          if (tweet.categories && tweet.categories.length > 0) {
            tweet.categories.forEach((cat) => group.categories.add(cat));
          }
        }
        processedTweetIds.add(tweet.tweetId);
      } else if (hasSectors) {
        for (const sector of tweet.sectors) {
          if (!sector || !sector.trim()) continue;

          const sectorKey = sector.trim();
          if (!sectorGroups.has(sectorKey)) {
            sectorGroups.set(sectorKey, {
              tweets: new Set(),
              categories: new Set(),
            });
          }
          const group = sectorGroups.get(sectorKey)!;
          group.tweets.add(tweet.tweetId);
          // Add all categories from tweet
          if (tweet.categories && tweet.categories.length > 0) {
            tweet.categories.forEach((cat) => group.categories.add(cat));
          }
        }
        processedTweetIds.add(tweet.tweetId);
      }
    }

    for (const [ticker, group] of tickerGroups.entries()) {
      const tweetIds = Array.from(group.tweets);

      if (tweetIds.length < 2) {
        continue;
      }

      const categories = Array.from(group.categories);

      let story = await this.prisma.story.findFirst({
        where: {
          type: StoryType.TICKER,
          ticker,
          sector: null,
          runId: runId || null,
        },
      });

      if (!story) {
        story = await this.prisma.story.create({
          data: {
            type: StoryType.TICKER,
            ticker,
            sector: null,
            runId: runId || null,
            scheduleId: scheduleId || null,
            status: StoryStatus.GROUPED,
            categories,
          },
        });
      } else {
        story = await this.prisma.story.update({
          where: { id: story.id },
          data: {
            categories,
            status: StoryStatus.GROUPED,
            updatedAt: new Date(),
          },
        });
      }

      for (const tweetId of tweetIds) {
        const existing = await this.prisma.storyTickerItem.findUnique({
          where: {
            storyId_tweetId: {
              storyId: story.id,
              tweetId,
            },
          },
        });

        if (!existing) {
          await this.prisma.storyTickerItem.create({
            data: {
              storyId: story.id,
              tweetId,
            },
          });
        }
      }

      tickerStories++;
    }

    for (const [sector, group] of sectorGroups.entries()) {
      const tweetIds = Array.from(group.tweets);

      if (tweetIds.length < 2) {
        continue;
      }

      const categories = Array.from(group.categories);

      let story = await this.prisma.story.findFirst({
        where: {
          type: StoryType.SECTOR,
          ticker: null,
          sector,
          runId: runId || null,
        },
      });

      if (!story) {
        story = await this.prisma.story.create({
          data: {
            type: StoryType.SECTOR,
            ticker: null,
            sector,
            runId: runId || null,
            scheduleId: scheduleId || null,
            status: StoryStatus.GROUPED,
            categories,
          },
        });
      } else {
        story = await this.prisma.story.update({
          where: { id: story.id },
          data: {
            categories,
            status: StoryStatus.GROUPED,
            updatedAt: new Date(),
          },
        });
      }

      for (const tweetId of tweetIds) {
        const existing = await this.prisma.storySectorItem.findUnique({
          where: {
            storyId_tweetId: {
              storyId: story.id,
              tweetId,
            },
          },
        });

        if (!existing) {
          await this.prisma.storySectorItem.create({
            data: {
              storyId: story.id,
              tweetId,
            },
          });
        }
      }

      sectorStories++;
    }

    return {
      tickerStories,
      sectorStories,
      totalTweetsGrouped: processedTweetIds.size,
    };
  }

  async addTweetToStory(storyId: number, tweetId: string): Promise<void> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }

    const tweet = await this.prisma.tweet.findUnique({
      where: { tweetId },
    });

    if (!tweet) {
      throw new NotFoundException(`Tweet with id ${tweetId} not found`);
    }

    if (story.type === StoryType.TICKER) {
      const existing = await this.prisma.storyTickerItem.findUnique({
        where: {
          storyId_tweetId: {
            storyId,
            tweetId,
          },
        },
      });

      if (!existing) {
        await this.prisma.storyTickerItem.create({
          data: {
            storyId,
            tweetId,
          },
        });
      }
    } else {
      const existing = await this.prisma.storySectorItem.findUnique({
        where: {
          storyId_tweetId: {
            storyId,
            tweetId,
          },
        },
      });

      if (!existing) {
        await this.prisma.storySectorItem.create({
          data: {
            storyId,
            tweetId,
          },
        });
      }
    }

    const tweetCategories = tweet.categories || [];
    const updatedCategories = Array.from(
      new Set([...story.categories, ...tweetCategories]),
    );
    await this.prisma.story.update({
      where: { id: storyId },
      data: {
        categories: updatedCategories,
        updatedAt: new Date(),
      },
    });
  }

  async removeTweetFromStory(storyId: number, tweetId: string): Promise<void> {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      throw new NotFoundException(`Story with id ${storyId} not found`);
    }

    if (story.type === StoryType.TICKER) {
      await this.prisma.storyTickerItem.deleteMany({
        where: {
          storyId,
          tweetId,
        },
      });
    } else {
      await this.prisma.storySectorItem.deleteMany({
        where: {
          storyId,
          tweetId,
        },
      });
    }

    const items =
      story.type === StoryType.TICKER
        ? await this.prisma.storyTickerItem.findMany({
            where: { storyId },
            include: { tweet: true },
          })
        : await this.prisma.storySectorItem.findMany({
            where: { storyId },
            include: { tweet: true },
          });

    const allCategories = items.flatMap((item) => item.tweet.categories || []);
    const categories = Array.from(new Set(allCategories));

    await this.prisma.story.update({
      where: { id: storyId },
      data: {
        categories,
        updatedAt: new Date(),
      },
    });
  }

  async getStories(filters?: {
    type?: StoryType;
    ticker?: string;
    sector?: string;
    runId?: string;
    status?: StoryStatus;
  }) {
    return await this.prisma.story.findMany({
      where: filters,
      include: {
        tickerItems: {
          include: {
            tweet: true,
          },
        },
        sectorItems: {
          include: {
            tweet: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStoryById(id: number) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        tickerItems: {
          include: {
            tweet: true,
          },
        },
        sectorItems: {
          include: {
            tweet: true,
          },
        },
      },
    });

    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    return story;
  }

  async deleteStory(id: number): Promise<void> {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }

    await this.prisma.story.delete({
      where: { id },
    });
  }
}
