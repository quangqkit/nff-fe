import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TweetClassificationService } from '../services/tweet-classification.service';
import { UpdateTweetCategoriesDto } from '../dto/update-tweet-categories.dto';
import { GetTweetsQueryDto } from '../dto/get-tweets-query.dto';

@Controller('tweets')
export class TweetsController {
  constructor(
    private readonly tweetClassificationService: TweetClassificationService,
  ) {}

  @Patch(':tweetId/categories')
  async updateTweetCategories(
    @Param('tweetId') tweetId: string,
    @Body() dto: UpdateTweetCategoriesDto,
  ) {
    if (!tweetId || tweetId.trim() === '') {
      throw new BadRequestException('tweetId is required');
    }
    return await this.tweetClassificationService.updateCategories(tweetId, dto);
  }

  @Get('categories/reference')
  getCategoriesReference() {
    return this.tweetClassificationService.getCategoriesReference();
  }

  @Get()
  async getTweets(@Query() query: GetTweetsQueryDto) {
    return await this.tweetClassificationService.getTweets(query);
  }
}
