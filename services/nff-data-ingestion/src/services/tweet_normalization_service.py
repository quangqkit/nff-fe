from __future__ import annotations

import json
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from utils.logger import get_logger

logger = get_logger(__name__)


class TweetNormalizationService:
    def __init__(self) -> None:
        from config import settings

        self.db_url = settings.DATABASE_URL
        self._pool = None

    async def get_pool(self):
        if self._pool is None:
            import asyncpg

            self._pool = await asyncpg.create_pool(
                self.db_url,
                min_size=1,
                max_size=5,
                command_timeout=60,
            )
        return self._pool

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.close()
            self._pool = None

    async def fetch_and_normalize(
        self,
        *,
        run_id: Optional[str] = None,
        tweet_ids: Optional[List[str]] = None,
        limit: Optional[int] = 20,
    ) -> List[Dict[str, Any]]:
        if (not run_id and not tweet_ids) or (
            tweet_ids is not None and len(tweet_ids) == 0
        ):
            raise ValueError("run_id or tweet_ids must be provided")

        if limit is not None and limit <= 0:
            raise ValueError("limit must be greater than zero")

        pool = await self.get_pool()
        async with pool.acquire() as conn:
            if tweet_ids:
                # Convert all tweet_ids to strings to ensure type matching
                tweet_ids_str = [str(tid) for tid in tweet_ids]
                records = await conn.fetch(
                    '''
                    SELECT "tweetId","text","createdAt","urls","symbols","runId","scheduleId"
                    FROM "TweetRaw"
                    WHERE "tweetId"::text = ANY($1::text[])
                    ORDER BY "createdAt" ASC
                    ''',
                    tweet_ids_str,
                )
                if len(records) == 0:
                    logger.warning(
                        "No records found in TweetRaw for tweet_ids: %s",
                        tweet_ids_str[:3]
                    )
            else:
                if limit is None:
                    records = await conn.fetch(
                        '''
                        SELECT "tweetId","text","createdAt","urls","symbols","runId","scheduleId"
                        FROM "TweetRaw"
                        WHERE "runId" = $1
                        ORDER BY "createdAt" ASC
                        ''',
                        run_id,
                    )
                else:
                    records = await conn.fetch(
                        '''
                        SELECT "tweetId","text","createdAt","urls","symbols","runId","scheduleId"
                        FROM "TweetRaw"
                        WHERE "runId" = $1
                        ORDER BY "createdAt" ASC
                        LIMIT $2
                        ''',
                        run_id,
                        limit,
                    )

        normalized: List[Dict[str, Any]] = []
        for record in records:
            item = self._normalize_record(dict(record))
            if item:
                normalized.append(item)

        logger.info(
            "Prepared %s tweet(s) for classification",
            len(normalized),
        )
        return normalized

    def _normalize_record(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        tweet_id = record.get("tweetId")
        if not tweet_id:
            return None

        text = record.get("text") or ""
        text = unicodedata.normalize("NFKC", text)
        text = text.encode("utf-8", "ignore").decode("utf-8").strip()

        timestamp_raw = record.get("createdAt")
        timestamp_str = None
        if isinstance(timestamp_raw, datetime):
            timestamp_str = self._to_utc_iso(timestamp_raw)
        elif isinstance(timestamp_raw, str) and timestamp_raw:
            try:
                parsed = datetime.fromisoformat(timestamp_raw)
                timestamp_str = self._to_utc_iso(parsed)
            except ValueError:
                timestamp_str = None

        urls = self._extract_urls(record.get("urls"))
        symbols_raw = self._extract_symbols(record.get("symbols"))

        return {
            "tweet_id": str(tweet_id),
            "text": text,
            "timestamp": timestamp_str,
            "urls": urls,
            "symbols_raw": symbols_raw,
            "run_id": record.get("runId"),
            "schedule_id": record.get("scheduleId"),
        }

    def _to_utc_iso(self, value: datetime) -> str:
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        else:
            value = value.astimezone(timezone.utc)
        return value.isoformat().replace("+00:00", "Z")

    def _extract_urls(self, raw_value: Any) -> List[str]:
        urls: List[str] = []
        if raw_value is None:
            return urls

        parsed = raw_value
        if isinstance(raw_value, str):
            try:
                parsed = json.loads(raw_value)
            except json.JSONDecodeError:
                parsed = []
        if not isinstance(parsed, list):
            parsed = []

        for item in parsed:
            url_candidate: Optional[str] = None
            if isinstance(item, str):
                url_candidate = item
            elif isinstance(item, dict):
                for key in ("expanded_url", "url", "display_url"):
                    value = item.get(key)
                    if isinstance(value, str) and value.strip():
                        url_candidate = value
                        break
            if url_candidate:
                cleaned = url_candidate.strip()
                if cleaned:
                    urls.append(cleaned)
        return urls

    def _extract_symbols(self, raw_value: Any) -> List[str]:
        if isinstance(raw_value, list):
            return [str(symbol).strip().upper() for symbol in raw_value if str(symbol).strip()]
        if isinstance(raw_value, str):
            try:
                parsed = json.loads(raw_value)
            except json.JSONDecodeError:
                parsed = []
            if isinstance(parsed, list):
                return [str(symbol).strip().upper() for symbol in parsed if str(symbol).strip()]
        return []
