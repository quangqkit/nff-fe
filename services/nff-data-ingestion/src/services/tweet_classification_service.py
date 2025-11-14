import asyncio
import json
import os
from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI, RateLimitError, APIError
from utils.logger import get_logger
from config import settings

logger = get_logger(__name__)


class TweetClassificationService:
    def __init__(self) -> None:
        api_key = settings.OPENAI_API_KEY
        self.openai_client = (
            AsyncOpenAI(api_key=api_key) if api_key else None
        )
        self.model = os.getenv("OPENAI_CLASSIFICATION_MODEL", "gpt-4o-mini")
        self.max_concurrency = int(
            os.getenv("TWEET_CLASSIFICATION_CONCURRENCY", "5")
        )

    async def classify_tweets(
        self, tweets: List[Dict[str, Any]], custom_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not tweets or not self.openai_client:
            if not self.openai_client:
                logger.error("[DEBUG] OpenAI client not configured")
            return []

        semaphore = asyncio.Semaphore(max(1, self.max_concurrency))
        tasks = [
            self._classify_with_semaphore(semaphore, tweet, custom_prompt)
            for tweet in tweets
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        classifications: List[Dict[str, Any]] = []
        for result in results:
            if isinstance(result, dict) and result.get("category"):
                classifications.append(result)
            elif isinstance(result, Exception):
                logger.error(f"[DEBUG] Classification task failed: {result}")
        return classifications

    async def _classify_with_semaphore(self, semaphore, tweet, custom_prompt):
        async with semaphore:
            return await self._classify_single(tweet, custom_prompt)

    async def _classify_single(
        self, tweet: Dict[str, Any], custom_prompt: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if custom_prompt:
            prompt = self._build_custom_prompt(tweet, custom_prompt)
            logger.info(
                f"[PROMPT] Tweet ID: {tweet.get('tweet_id')} - Using CUSTOM prompt"
            )
        else:
            prompt = self._build_prompt(tweet)
            logger.info(
                f"[PROMPT] Tweet ID: {tweet.get('tweet_id')} - Using DEFAULT prompt"
            )
        
        system_message = (
            "You are a financial tweet classifier. "
            "Always respond with valid JSON."
        )
        
        logger.info(
            f"[PROMPT] Tweet ID: {tweet.get('tweet_id')}\n"
            f"System: {system_message}\n"
            f"User Prompt:\n{prompt}\n"
            f"--- End Prompt ---"
        )
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_message,
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=300,
            )
            content = response.choices[0].message.content
            logger.info(
                f"[PROMPT] Tweet ID: {tweet.get('tweet_id')} - Response: {content}"
            )
            return self._parse_response(tweet["tweet_id"], content)
        except RateLimitError as exc:
            logger.error(f"[DEBUG] OpenAI rate limit error: {str(exc)}")
        except APIError as exc:
            logger.error(f"[DEBUG] OpenAI API error: {str(exc)}")
        except Exception as exc:
            logger.error(f"[DEBUG] OpenAI classification error: {str(exc)}")
        return None

    def _build_prompt(self, tweet: Dict[str, Any]) -> str:
        urls = ", ".join(tweet.get("urls") or []) or "None"
        symbols = ", ".join(tweet.get("symbols_raw") or []) or "None"
        return (
            "Classify the tweet into one category from this list: "
            "Macro, Sector, Earnings, Analyst, Corporate/Regulatory, Flows/Options.\n"
            "Extract tickers (uppercase stock symbols) and sectors relevant to the tweet.\n"
            "Return JSON with keys: category (string), tickers (string array), sectors (string array).\n"
            "If unsure, leave tickers or sectors as empty arrays. Category must always be one of the six options.\n"
            "Tweet text:\n"
            f"{tweet.get('text')}\n"
            f"Timestamp: {tweet.get('timestamp')}\n"
            f"Symbols in text: {symbols}\n"
            f"URLs: {urls}\n"
            "JSON:"
        )

    def _build_custom_prompt(
        self, tweet: Dict[str, Any], custom_prompt_template: str
    ) -> str:
        urls = ", ".join(tweet.get("urls") or []) or "None"
        symbols = ", ".join(tweet.get("symbols_raw") or []) or "None"
        
        try:
            prompt = custom_prompt_template.format(
                text=tweet.get("text", ""),
                timestamp=tweet.get("timestamp", ""),
                urls=urls,
                symbols=symbols,
                symbols_raw=symbols,
            )
            return prompt
        except KeyError as e:
            logger.warning(
                f"[PROMPT] Missing placeholder in custom prompt: {e}. Using default prompt."
            )
            return self._build_prompt(tweet)

    def _parse_response(
        self, tweet_id: str, response_text: str
    ) -> Optional[Dict[str, Any]]:
        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3].strip()
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error(
                f"[DEBUG] Failed to parse classification response for {tweet_id}: {str(exc)}"
            )
            return None

        category = self._map_category(data.get("category"))
        tickers = [
            ticker.strip().upper()
            for ticker in data.get("tickers") or []
            if ticker and ticker.strip()
        ]
        sectors = [
            sector.strip()
            for sector in data.get("sectors") or []
            if sector and sector.strip()
        ]

        if not category:
            logger.error(
                f"[DEBUG] Invalid category received for {tweet_id}: {data.get('category')}"
            )
            return None

        return {
            "tweet_id": tweet_id,
            "category": category,
            "tickers": tickers,
            "sectors": sectors,
        }

    def _map_category(self, raw: Optional[str]) -> Optional[str]:
        if not raw:
            return None
        normalized = raw.strip().lower()
        mapping = {
            "macro": "MACRO",
            "sector": "SECTOR",
            "earnings": "EARNINGS",
            "analyst": "ANALYST",
            "analyst rating": "ANALYST",
            "corporate": "CORPORATE_REGULATORY",
            "corporate/regulatory": "CORPORATE_REGULATORY",
            "corporate regulatory": "CORPORATE_REGULATORY",
            "regulatory": "CORPORATE_REGULATORY",
            "flows/options": "FLOWS_OPTIONS",
            "flows options": "FLOWS_OPTIONS",
            "options": "FLOWS_OPTIONS",
            "flows": "FLOWS_OPTIONS",
        }
        return mapping.get(normalized)

    def get_prompt(self, tweet: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self._build_prompt(tweet)
        system_message = (
            "You are a financial tweet classifier. "
            "Always respond with valid JSON."
        )
        return {
            "tweet_id": tweet.get("tweet_id"),
            "system_message": system_message,
            "user_prompt": prompt,
            "model": self.model,
            "temperature": 0.0,
            "max_tokens": 300,
        }

