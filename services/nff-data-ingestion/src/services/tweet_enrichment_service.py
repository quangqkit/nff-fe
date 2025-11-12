"""
Tweet Enrichment Service
Handles AI-powered tweet analysis using OpenAI API
"""

import asyncio
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import asyncpg
from openai import AsyncOpenAI
from openai import RateLimitError, APIError
from utils.logger import get_logger
from config import settings

logger = get_logger(__name__)

class TweetEnrichmentService:
    
    def __init__(self):
        self.db_url = settings.DATABASE_URL
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
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

    async def enrich_tweets_batch(self, run_id: str, target_anchor_utc: Optional[datetime] = None, market_context_override: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        start_time = datetime.utcnow()
        
        try:
            logger.info(f"Starting tweet enrichment for run {run_id}")
            
            pool = await self._get_connection_pool()
            
            raw_tweets = await self._fetch_raw_tweets(pool, run_id)
            if not raw_tweets:
                logger.info(f"[DEBUG] No raw tweets found for run {run_id}")
                return {'processed_count': 0, 'errors': 0, 'quota_exceeded': False}
            
            logger.info(f"[DEBUG] Found {len(raw_tweets)} raw tweets for run {run_id}")
            
            # Determine market context window anchored to Israel 03:00
            anchor_utc = target_anchor_utc or datetime.utcnow()
            il_tz = ZoneInfo("Asia/Jerusalem")
            anchor_il = anchor_utc.astimezone(il_tz)
            target_anchor_il = anchor_il.replace(hour=3, minute=0, second=0, microsecond=0)
            if anchor_il < target_anchor_il:
                target_anchor_il = target_anchor_il - timedelta(days=1)
            # 60-minute window centered on 03:00 IL
            start_utc = (target_anchor_il - timedelta(minutes=30)).astimezone(ZoneInfo("UTC"))
            end_utc = (target_anchor_il + timedelta(minutes=30)).astimezone(ZoneInfo("UTC"))

            logger.info(
                f"[DEBUG] Market context window (UTC): {start_utc.isoformat()} -> {end_utc.isoformat()} (anchor IL 03:00)"
            )

            if market_context_override is not None:
                market_context = market_context_override
                logger.info("[DEBUG] Using market context provided by caller (NestJS)")
            else:
                logger.warning("[DEBUG] No market_context provided by caller; proceeding with empty context")
                market_context = {'gainers': [], 'losers': []}
            logger.info(f"[DEBUG] Market context: {len(market_context['gainers'])} gainers, {len(market_context['losers'])} losers")
            
            enriched_count = 0
            error_count = 0
            quota_exceeded = False
            failed_tweets = []
            
            for idx, tweet in enumerate(raw_tweets, 1):
                try:
                    logger.info(f"[DEBUG] Processing tweet {idx}/{len(raw_tweets)}: {tweet['tweetId']}")
                    enrichment = await self._enrich_single_tweet_with_retry(tweet, market_context)
                    await self._save_enrichment(pool, enrichment)
                    enriched_count += 1
                    logger.info(
                        f"[DEBUG] ✅ Enriched tweet {tweet['tweetId']}: "
                        f"sentiment={enrichment['sentiment']}, "
                        f"topic={enrichment['topic']}, "
                        f"tickers={enrichment['tickerCandidates']}, "
                        f"moverFlag={enrichment['moverFlag']}"
                    )
                except APIError as e:
                    error_str = str(e)
                    error_type = getattr(e, 'code', None) or 'unknown'
                    
                    if error_type == 'insufficient_quota':
                        quota_exceeded = True
                        logger.critical(f"OpenAI quota exceeded - stopping enrichment batch")
                        failed_tweets.append({
                            'tweetId': tweet['tweetId'],
                            'error': error_str,
                            'errorType': 'quota_exceeded'
                        })
                        error_count += 1
                        break
                    else:
                        logger.error(f"Failed to enrich tweet {tweet['tweetId']}: {error_str} (code: {error_type})")
                        failed_tweets.append({
                            'tweetId': tweet['tweetId'],
                            'error': error_str,
                            'errorType': f'api_error_{error_type}'
                        })
                        error_count += 1
                except Exception as e:
                    logger.error(f"Failed to enrich tweet {tweet['tweetId']}: {str(e)}")
                    failed_tweets.append({
                        'tweetId': tweet['tweetId'],
                        'error': str(e),
                        'errorType': 'unknown_error'
                    })
                    error_count += 1
            
            total_time = (datetime.utcnow() - start_time).total_seconds()
            
            if quota_exceeded:
                logger.critical(
                    f"Enrichment stopped due to quota: {enriched_count}/{len(raw_tweets)} tweets processed, "
                    f"{error_count} errors in {total_time:.2f}s"
                )
            else:
                logger.info(
                    f"Enrichment completed: {enriched_count} tweets processed, {error_count} errors in {total_time:.2f}s"
                )
            
            return {
                'processed_count': enriched_count,
                'errors': error_count,
                'quota_exceeded': quota_exceeded,
                'total_time': total_time,
                'failed_tweets': failed_tweets[:10]
            }
            
        except Exception as e:
            logger.error(f"Tweet enrichment failed: {str(e)}")
            raise
        finally:
            await self._close_connection_pool()

    async def _fetch_raw_tweets(self, pool, run_id: str) -> List[Dict[str, Any]]:
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT "tweetId", "text", "symbols", "createdAt"
                FROM "TweetRaw" 
                WHERE "runId" = $1
                ORDER BY "createdAt" DESC
            """, run_id)
            
            return [dict(row) for row in rows]

    # No TradingView fetching in Python; market context must come from caller

    async def _enrich_single_tweet_with_retry(
        self, 
        tweet: Dict[str, Any], 
        market_context: Dict[str, Any],
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """Enrich a single tweet with retry logic and exponential backoff"""
        for attempt in range(max_retries):
            try:
                return await self._enrich_single_tweet(tweet, market_context)
            
            except RateLimitError as e:
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"Rate limit hit for tweet {tweet['tweetId']}, "
                        f"retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    logger.error(f"Rate limit exceeded after {max_retries} attempts for tweet {tweet['tweetId']}")
                    raise
            
            except APIError as e:
                error_code = getattr(e, 'code', None)
                if error_code == 'insufficient_quota':
                    raise
                elif attempt < max_retries - 1 and error_code != 'invalid_request_error':
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"API error {error_code} for tweet {tweet['tweetId']}, "
                        f"retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})"
                    )
                    await asyncio.sleep(wait_time)
                else:
                    raise
        
        raise Exception(f"Failed to enrich tweet {tweet['tweetId']} after {max_retries} attempts")

    async def _enrich_single_tweet(self, tweet: Dict[str, Any], market_context: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self._build_enrichment_prompt(tweet, market_context)
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=500
        )
        
        return self._parse_openai_response(tweet['tweetId'], response.choices[0].message.content)

    def _build_enrichment_prompt(self, tweet: Dict[str, Any], market_context: Dict[str, Any]) -> str:
        gainers_text = ", ".join([f"{s['symbol']} ({s['preMarketChangePercent']})" for s in market_context['gainers'][:10]])
        losers_text = ", ".join([f"{s['symbol']} ({s['preMarketChangePercent']})" for s in market_context['losers'][:10]])
        
        return f"""
Analyze this financial tweet and provide structured analysis:

Tweet: "{tweet['text']}"
Symbols mentioned: {', '.join(tweet['symbols']) if tweet['symbols'] else 'None'}
Created: {tweet['createdAt']}

Market Context:
- Top Gainers: {gainers_text}
- Top Losers: {losers_text}

Provide JSON response with these exact fields:
{{
  "aiSummary": "Brief summary (max 200 chars)",
  "aiLabels": ["label1", "label2"],
  "aiConfidence": 0.85,
  "sentiment": "positive|negative|neutral",
  "topic": "earnings|analyst_rating|guidance|ma|regulation|macro|geopolitics|legal|product|other",
  "tickerCandidates": ["AAPL", "TSLA"],
  "moverFlag": true|false,
  "reasonTypes": ["earnings", "analyst_rating"]
}}

Rules:
- sentiment: positive/negative/neutral only
- topic: one of the listed options only
- aiConfidence: decimal 0-1
- moverFlag: true if significant market impact
- reasonTypes: array of valid types
- tickerCandidates: extract stock symbols mentioned
"""

    def _parse_openai_response(self, tweet_id: str, response_text: str) -> Dict[str, Any]:
        try:
            data = json.loads(response_text.strip())
            
            return {
                'tweetId': tweet_id,
                'aiSummary': data.get('aiSummary', ''),
                'aiLabels': data.get('aiLabels', []),
                'aiConfidence': float(data.get('aiConfidence', 0.0)),
                'sentiment': data.get('sentiment', 'neutral'),
                'topic': data.get('topic', 'other'),
                'tickerCandidates': data.get('tickerCandidates', []),
                'moverFlag': bool(data.get('moverFlag', False)),
                'reasonTypes': data.get('reasonTypes', []),
                'processedAt': datetime.utcnow()
            }
        except Exception as e:
            logger.error(f"Failed to parse OpenAI response for tweet {tweet_id}: {str(e)}")
            return {
                'tweetId': tweet_id,
                'aiSummary': '',
                'aiLabels': [],
                'aiConfidence': 0.0,
                'sentiment': 'neutral',
                'topic': 'other',
                'tickerCandidates': [],
                'moverFlag': False,
                'reasonTypes': [],
                'processedAt': datetime.utcnow()
            }

    async def _save_enrichment(self, pool, enrichment: Dict[str, Any]):
        async with pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO "TweetEnrichment" (
                    "tweetId", "aiSummary", "aiLabels", "aiConfidence", 
                    "sentiment", "topic", "tickerCandidates", "moverFlag", 
                    "reasonTypes", "processedAt", "createdAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                ON CONFLICT ("tweetId") DO UPDATE SET
                    "aiSummary" = EXCLUDED."aiSummary",
                    "aiLabels" = EXCLUDED."aiLabels",
                    "aiConfidence" = EXCLUDED."aiConfidence",
                    "sentiment" = EXCLUDED."sentiment",
                    "topic" = EXCLUDED."topic",
                    "tickerCandidates" = EXCLUDED."tickerCandidates",
                    "moverFlag" = EXCLUDED."moverFlag",
                    "reasonTypes" = EXCLUDED."reasonTypes",
                    "processedAt" = EXCLUDED."processedAt",
                    "updatedAt" = NOW()
            """, 
                enrichment['tweetId'],
                enrichment['aiSummary'],
                enrichment['aiLabels'],
                enrichment['aiConfidence'],
                enrichment['sentiment'],
                enrichment['topic'],
                enrichment['tickerCandidates'],
                enrichment['moverFlag'],
                enrichment['reasonTypes'],
                enrichment['processedAt']
            )
