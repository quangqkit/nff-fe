from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.tweet_pipeline_service import TweetPipelineService
from services.tweet_normalization_service import TweetNormalizationService
from services.tweet_classification_service import TweetClassificationService
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


class ClassifyTweetsRequest(BaseModel):
    tweet_ids: Optional[List[str]] = Field(default=None, alias="tweetIds")
    prompt: Optional[str] = None

    model_config = {
        "populate_by_name": True,
        "extra": "forbid",
    }

    def ensure_valid(self) -> None:
        if not self.tweet_ids or len(self.tweet_ids) == 0:
            raise ValueError("tweetIds must be provided and non-empty")


class ClassifiedTweet(BaseModel):
    tweet_id: str = Field(alias="tweet_id")
    categories: List[str] = Field(default_factory=list)
    sub_categories: Dict[str, List[str]] = Field(default_factory=dict, alias="sub_categories")
    tickers: List[str] = Field(default_factory=list)
    sectors: List[str] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
    }


class ClassifyTweetsResponse(BaseModel):
    count: int
    items: List[ClassifiedTweet]


@router.post("/tweets/classify", response_model=ClassifyTweetsResponse)
async def classify_tweets(request: ClassifyTweetsRequest) -> Dict[str, Any]:
    try:
        request.ensure_valid()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    pipeline = TweetPipelineService()
    try:
        results = await pipeline.classify_tweets(
            tweet_ids=request.tweet_ids,
            custom_prompt=request.prompt,
        )
        return {
            "count": len(results),
            "items": results,
        }
    except RuntimeError as exc:
        logger.error("Classification aborted: %s", str(exc))
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("Failed to classify tweets: %s", str(exc))
        raise HTTPException(status_code=500, detail="Failed to classify tweets")
    finally:
        await pipeline.close()


@router.post("/tweets/preview-prompt")
async def preview_prompt(request: ClassifyTweetsRequest) -> Dict[str, Any]:
    try:
        request.ensure_valid()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    normalization_service = TweetNormalizationService()
    classification_service = TweetClassificationService()
    
    try:
        normalized = await normalization_service.fetch_and_normalize(
            tweet_ids=request.tweet_ids,
            limit=None,
        )

        if not normalized:
            raise HTTPException(status_code=404, detail="No tweets found")

        prompts = []
        for tweet in normalized:
            prompt_info = classification_service.get_prompt(tweet)
            prompts.append(prompt_info)

        return {
            "count": len(prompts),
            "items": prompts,
        }
    except Exception as exc:
        logger.exception("[API] Failed to preview prompt: %s", str(exc))
        raise HTTPException(status_code=500, detail="Failed to preview prompt")
    finally:
        await normalization_service.close()

