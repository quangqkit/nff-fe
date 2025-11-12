"""
Catalyst Service
Groups enriched tweets into market catalysts
"""

import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime, timedelta
import asyncpg
from utils.logger import get_logger
from config import settings

logger = get_logger(__name__)

class CatalystService:
    
    def __init__(self):
        self.db_url = settings.DATABASE_URL
        self._pool = None

    async def _get_connection_pool(self):
        if self._pool is None:
            self._pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
        return self._pool

    async def _close_connection_pool(self):
        if self._pool:
            await self._pool.close()
            self._pool = None

    async def group_tweets_to_catalysts(self, time_window_hours: int = 6) -> Dict[str, Any]:
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"Starting catalyst grouping with {time_window_hours}h time window")
            
            pool = await self._get_connection_pool()
            
            enriched_tweets = await self._fetch_enriched_tweets(pool, time_window_hours)
            if not enriched_tweets:
                logger.info("[DEBUG] No enriched tweets found for catalyst grouping")
                logger.info("[DEBUG] Possible reasons:")
                logger.info("[DEBUG]   - No tweets have been enriched yet")
                logger.info("[DEBUG]   - No tweets have moverFlag=true")
                logger.info("[DEBUG]   - All enriched tweets are older than time window")
                total_time = (datetime.utcnow() - start_time).total_seconds()
                return {
                    'catalysts_created': 0, 
                    'tweets_grouped': 0,
                    'total_time': total_time
                }
            
            logger.info(f"[DEBUG] Grouping {len(enriched_tweets)} enriched tweets into catalysts...")
            catalysts = await self._group_tweets_by_catalyst(enriched_tweets, time_window_hours)
            logger.info(f"[DEBUG] Initial grouping created {len(catalysts)} catalyst groups")
            
            merged_catalysts = await self._merge_overlapping_catalysts(pool, catalysts)
            logger.info(f"[DEBUG] After merging: {len(merged_catalysts)} catalyst groups")
            
            catalyst_count = 0
            tweets_grouped = 0
            
            for catalyst in merged_catalysts:
                tweet_count = len(catalyst['tweet_ids'])
                if tweet_count >= 2:
                    await self._save_catalyst(pool, catalyst)
                    catalyst_count += 1
                    tweets_grouped += tweet_count
                    logger.info(
                        f"[DEBUG] Created catalyst: {catalyst['ticker']}, "
                        f"{tweet_count} tweets, reasons={catalyst['reasonTypes']}"
                    )
                else:
                    logger.debug(
                        f"[DEBUG] Skipped catalyst {catalyst['ticker']}: "
                        f"only {tweet_count} tweets (need >= 2)"
                    )
            
            total_time = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(f"Catalyst grouping completed: {catalyst_count} catalysts created, {tweets_grouped} tweets grouped in {total_time:.2f}s")
            
            return {
                'catalysts_created': catalyst_count,
                'tweets_grouped': tweets_grouped,
                'total_time': total_time
            }
            
        except Exception as e:
            logger.error(f"Catalyst grouping failed: {str(e)}")
            raise
        finally:
            await self._close_connection_pool()

    async def _fetch_enriched_tweets(self, pool, time_window_hours: int) -> List[Dict[str, Any]]:
        cutoff_time = datetime.utcnow() - timedelta(hours=time_window_hours)
        
        logger.info(f"[DEBUG] Fetching enriched tweets with moverFlag=true since {cutoff_time}")
        
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    "tweetId", "aiSummary", "aiLabels", "aiConfidence",
                    "sentiment", "topic", "tickerCandidates", "moverFlag",
                    "reasonTypes", "processedAt"
                FROM "TweetEnrichment" 
                WHERE "moverFlag" = true 
                AND "processedAt" >= $1
                ORDER BY "processedAt" DESC
            """, cutoff_time)
            
            tweets = [dict(row) for row in rows]
            logger.info(f"[DEBUG] Found {len(tweets)} enriched tweets with moverFlag=true")
            
            if tweets:
                logger.info(f"[DEBUG] Sample tweets: {tweets[0]['tweetId'] if tweets else 'N/A'}")
                for i, tweet in enumerate(tweets[:3]):
                    logger.info(
                        f"[DEBUG] Tweet {i+1}: {tweet['tweetId']}, "
                        f"tickers={tweet['tickerCandidates']}, "
                        f"reasons={tweet['reasonTypes']}"
                    )
            
            return tweets

    async def _group_tweets_by_catalyst(self, tweets: List[Dict[str, Any]], time_window_hours: int) -> List[Dict[str, Any]]:
        groups = {}
        
        for tweet in tweets:
            for ticker in tweet['tickerCandidates']:
                if not ticker:
                    continue
                    
                reason_types = tuple(sorted(tweet['reasonTypes']))
                time_window = self._get_time_window(tweet['processedAt'], time_window_hours)
                
                key = f"{ticker}_{reason_types}_{time_window}"
                
                if key not in groups:
                    groups[key] = {
                        'ticker': ticker,
                        'reasonTypes': list(reason_types),
                        'timeWindow': time_window,
                        'tweet_ids': [],
                        'summaries': [],
                        'confidences': [],
                        'sentiments': [],
                        'topics': []
                    }
                
                groups[key]['tweet_ids'].append(tweet['tweetId'])
                groups[key]['summaries'].append(tweet['aiSummary'])
                groups[key]['confidences'].append(tweet['aiConfidence'])
                groups[key]['sentiments'].append(tweet['sentiment'])
                groups[key]['topics'].append(tweet['topic'])
        
        return list(groups.values())

    def _get_time_window(self, timestamp: datetime, hours: int) -> datetime:
        hours_bucket = max(1, int(hours))
        bucket_index = (timestamp.hour // hours_bucket) * hours_bucket
        return timestamp.replace(hour=bucket_index, minute=0, second=0, microsecond=0)

    async def _save_catalyst(self, pool, catalyst: Dict[str, Any]):
        title = self._generate_catalyst_title(catalyst)
        summary = self._merge_summaries(catalyst['summaries'])
        avg_confidence = sum(catalyst['confidences']) / len(catalyst['confidences'])
        tweet_links = catalyst.get('tweet_links', [])
        
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO "Catalyst" (
                    "title", "summary", "ticker", "reasonTypes", 
                    "mergedFromTweetsIds", "tweetLinks", "confidence", "tweetCount", "timeWindow",
                    "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            """, 
                title,
                summary,
                catalyst['ticker'],
                catalyst['reasonTypes'],
                catalyst['tweet_ids'],
                json.dumps(tweet_links) if tweet_links else None,
                avg_confidence,
                len(catalyst['tweet_ids']),
                catalyst['timeWindow']
            )

    def _generate_catalyst_title(self, catalyst: Dict[str, Any]) -> str:
        reason_text = " & ".join(catalyst['reasonTypes']) if catalyst['reasonTypes'] else "Market Activity"
        return f"{catalyst['ticker']} - {reason_text} ({len(catalyst['tweet_ids'])} tweets)"

    def _merge_summaries(self, summaries: List[str]) -> str:
        valid_summaries = [s for s in summaries if s and s.strip()]
        if not valid_summaries:
            return "Multiple tweets discussing market activity"
        
        if len(valid_summaries) == 1:
            return valid_summaries[0]
        
        return f"Key themes: {'; '.join(valid_summaries[:3])}"

    async def _merge_overlapping_catalysts(self, pool, catalysts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not catalysts:
            return []
        
        ticker_groups = {}
        
        for catalyst in catalysts:
            ticker = catalyst['ticker']
            if ticker not in ticker_groups:
                ticker_groups[ticker] = []
            ticker_groups[ticker].append(catalyst)
        
        merged_catalysts = []
        
        for ticker, ticker_catalysts in ticker_groups.items():
            if len(ticker_catalysts) == 1:
                merged_catalysts.append(ticker_catalysts[0])
                continue
            
            merged = await self._merge_ticker_catalysts(pool, ticker, ticker_catalysts)
            merged_catalysts.append(merged)
        
        return merged_catalysts

    async def _merge_ticker_catalysts(self, pool, ticker: str, catalysts: List[Dict[str, Any]]) -> Dict[str, Any]:
        all_tweet_ids = []
        all_summaries = []
        all_confidences = []
        all_sentiments = []
        all_topics = []
        all_reason_types = set()
        earliest_time = None
        
        for catalyst in catalysts:
            all_tweet_ids.extend(catalyst['tweet_ids'])
            all_summaries.extend(catalyst['summaries'])
            all_confidences.extend(catalyst['confidences'])
            all_sentiments.extend(catalyst['sentiments'])
            all_topics.extend(catalyst['topics'])
            all_reason_types.update(catalyst['reasonTypes'])
            
            if earliest_time is None or catalyst['timeWindow'] < earliest_time:
                earliest_time = catalyst['timeWindow']
        
        tweet_links = await self._get_tweet_links(pool, all_tweet_ids)
        
        return {
            'ticker': ticker,
            'reasonTypes': list(all_reason_types),
            'timeWindow': earliest_time,
            'tweet_ids': all_tweet_ids,
            'summaries': all_summaries,
            'confidences': all_confidences,
            'sentiments': all_sentiments,
            'topics': all_topics,
            'tweet_links': tweet_links
        }

    async def _get_tweet_links(self, pool, tweet_ids: List[str]) -> List[Dict[str, str]]:
        if not tweet_ids:
            return []
        
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT "tweetId", "authorHandle", "createdAt", "text"
                FROM "TweetRaw" 
                WHERE "tweetId" = ANY($1)
                ORDER BY "createdAt" DESC
            """, tweet_ids)
            
            return [
                {
                    'tweet_id': row['tweetId'],
                    'author': row['authorHandle'],
                    'created_at': row['createdAt'].isoformat(),
                    'text_preview': row['text'][:100] + '...' if len(row['text']) > 100 else row['text']
                }
                for row in rows
            ]
