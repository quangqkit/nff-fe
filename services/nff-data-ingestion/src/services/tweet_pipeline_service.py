from __future__ import annotations

from typing import Any, Dict, List, Optional

from utils.logger import get_logger

from .tweet_classification_service import TweetClassificationService
from .tweet_normalization_service import TweetNormalizationService

logger = get_logger(__name__)


class TweetPipelineService:
    def __init__(self) -> None:
        self.normalization_service = TweetNormalizationService()
        self.classification_service = TweetClassificationService()

    async def classify_tweets(
        self,
        *,
        tweet_ids: Optional[List[str]] = None,
        custom_prompt: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        if not self.classification_service.openai_client:
            raise RuntimeError("OpenAI client is not configured")

        if not tweet_ids or len(tweet_ids) == 0:
            raise ValueError("tweet_ids must be provided")

        normalized = await self.normalization_service.fetch_and_normalize(
            tweet_ids=tweet_ids,
            limit=None,
        )

        if not normalized:
            logger.info("[PIPELINE] No tweets available for classification")
            return []

        if custom_prompt:
            logger.info("[PIPELINE] Using custom prompt for classification")
        else:
            logger.info("[PIPELINE] Using default prompt for classification")

        classifications = await self.classification_service.classify_tweets(
            normalized, custom_prompt=custom_prompt
        )
        if not classifications:
            logger.warning("[PIPELINE] Classification did not produce any results")
            return []

        logger.info(
            "[PIPELINE] Received %s classification(s) from OpenAI",
            len(classifications),
        )
        for item in classifications:
            logger.info(
                "[PIPELINE] Classification: tweet_id=%s, category=%s, tickers=%s, sectors=%s",
                item.get("tweet_id"),
                item.get("category"),
                item.get("tickers"),
                item.get("sectors"),
            )

        await self._persist_classifications(classifications)
        
        filtered = [
            item
            for item in classifications
            if item.get("tickers") or item.get("sectors")
        ]

        return [self._format_response_item(item) for item in filtered]

    async def close(self) -> None:
        await self.normalization_service.close()

    async def _persist_classifications(
        self,
        classifications: List[Dict[str, Any]],
    ) -> None:
        if not classifications:
            logger.warning("[PIPELINE] No classifications to persist")
            return

        pool = await self.normalization_service.get_pool()
        async with pool.acquire() as conn:
            saved_count = 0
            deleted_count = 0
            
            for item in classifications:
                tweet_id = item.get("tweet_id")
                if not tweet_id:
                    logger.warning("[PIPELINE] Skipping classification without tweet_id")
                    continue
                    
                category = item.get("category")
                if not category:
                    logger.warning(
                        "[PIPELINE] Skipping classification for tweet_id=%s: missing category",
                        tweet_id,
                    )
                    continue
                    
                tickers = item.get("tickers") or []
                sectors = item.get("sectors") or []

                try:
                    if not tickers and not sectors:
                        logger.info(
                            "[PIPELINE] Deleting Tweet for tweet_id=%s (empty tickers and sectors)",
                            tweet_id,
                        )
                        await conn.execute(
                            'DELETE FROM "Tweet" WHERE "tweetId" = $1',
                            tweet_id,
                        )
                        deleted_count += 1
                    else:
                        logger.info(
                            "[PIPELINE] Saving Tweet: tweet_id=%s, category=%s, tickers=%s, sectors=%s",
                            tweet_id,
                            category,
                            tickers,
                            sectors,
                        )
                        await conn.execute(
                            '''
                            INSERT INTO "Tweet" (
                                "tweetId","category","tickers","sectors","createdAt","updatedAt"
                            ) VALUES ($1,$2,$3,$4,timezone('utc', now()),timezone('utc', now()))
                            ON CONFLICT ("tweetId") DO UPDATE SET
                                "category" = EXCLUDED."category",
                                "tickers" = EXCLUDED."tickers",
                                "sectors" = EXCLUDED."sectors",
                                "updatedAt" = timezone('utc', now())
                            ''',
                            tweet_id,
                            category,
                            tickers,
                            sectors,
                        )
                        saved_count += 1
                        logger.info(
                            "[PIPELINE] Successfully saved Tweet for tweet_id=%s",
                            tweet_id,
                        )
                except Exception as exc:
                    logger.error(
                        "[PIPELINE] Failed to persist classification for tweet_id=%s: %s",
                        tweet_id,
                        str(exc),
                        exc_info=True,
                    )

        logger.info(
            "[PIPELINE] Processed %s classification(s): saved=%s, deleted=%s",
            len(classifications),
            saved_count,
            deleted_count,
        )

    def _format_response_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        category_raw = item.get("category") or ""
        display_category = {
            "MACRO": "Macro",
            "SECTOR": "Sector",
            "EARNINGS": "Earnings",
            "ANALYST": "Analyst",
            "CORPORATE_REGULATORY": "Corporate",
            "FLOWS_OPTIONS": "Options",
        }.get(category_raw, item.get("category"))

        return {
            "tweet_id": item.get("tweet_id"),
            "category": display_category,
            "tickers": item.get("tickers") or [],
            "sectors": item.get("sectors") or [],
        }

