from __future__ import annotations

import json
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
            logger.warning(
                "No tweets available for classification. Tweet IDs: %s",
                tweet_ids
            )
            return []

        classifications = await self.classification_service.classify_tweets(
            normalized, custom_prompt=custom_prompt
        )
        if not classifications:
            logger.warning("Classification did not produce any results")
            return []

        await self._persist_classifications(classifications)

        return [self._format_response_item(item) for item in classifications]

    async def close(self) -> None:
        await self.normalization_service.close()

    async def _persist_classifications(
        self,
        classifications: List[Dict[str, Any]],
    ) -> None:
        if not classifications:
            return

        pool = await self.normalization_service.get_pool()
        async with pool.acquire() as conn:
            saved_count = 0
            deleted_count = 0
            
            for item in classifications:
                tweet_id = item.get("tweet_id")
                if not tweet_id:
                    continue
                    
                categories = item.get("categories") or []
                sub_categories = item.get("sub_categories") or {}
                
                if not categories and not sub_categories:
                    continue
                    
                tickers = item.get("tickers") or []
                sectors = item.get("sectors") or []

                try:
                    if not tickers and not sectors:
                        await conn.execute(
                            'DELETE FROM "Tweet" WHERE "tweetId" = $1',
                            tweet_id,
                        )
                        deleted_count += 1
                    else:
                        await conn.execute(
                            '''
                            INSERT INTO "Tweet" (
                                "tweetId","categories","subCategories","tickers","sectors","createdAt","updatedAt"
                            ) VALUES ($1,$2,$3::jsonb,$4,$5,timezone('utc', now()),timezone('utc', now()))
                            ON CONFLICT ("tweetId") DO UPDATE SET
                                "categories" = EXCLUDED."categories",
                                "subCategories" = EXCLUDED."subCategories",
                                "tickers" = EXCLUDED."tickers",
                                "sectors" = EXCLUDED."sectors",
                                "updatedAt" = timezone('utc', now())
                            ''',
                            tweet_id,
                            categories,
                            json.dumps(sub_categories) if sub_categories else None,
                            tickers,
                            sectors,
                        )
                        saved_count += 1
                except Exception as exc:
                    logger.error(
                        "Failed to persist classification for tweet_id=%s: %s",
                        tweet_id,
                        str(exc),
                        exc_info=True,
                    )

        logger.info(
            "Processed %s classification(s): saved=%s, deleted=%s",
            len(classifications),
            saved_count,
            deleted_count,
        )

    def _format_response_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "tweet_id": item.get("tweet_id"),
            "categories": item.get("categories") or [],
            "sub_categories": item.get("sub_categories") or {},
            "tickers": item.get("tickers") or [],
            "sectors": item.get("sectors") or [],
        }

