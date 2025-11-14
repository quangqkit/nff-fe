import json
import os
import re
import tempfile
import logging
from datetime import datetime
from typing import Any, Dict, List

import pandas as pd
import requests

logger = logging.getLogger(__name__)


class LobstrProcessorService:
    def __init__(self):
        from config import settings

        self.db_url = settings.DATABASE_URL
        self._pool = None

    async def _get_connection_pool(self):
        if self._pool is None:
            import asyncpg

            self._pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )
        return self._pool

    async def _close_connection_pool(self):
        if self._pool:
            await self._pool.close()
            self._pool = None

    async def process_download(
        self, download_url: str, schedule_id: str, run_id: str
    ) -> Dict[str, Any]:
        pool = await self._get_connection_pool()
        try:
            csv_path = await self._download_csv(download_url)
            tweets_data = await self._parse_csv_data(csv_path)
            result = await self._save_tweets_to_database(
                pool, tweets_data, schedule_id, run_id
            )
            return result
        except Exception as e:
            logger.error(
                f"Error processing download for run {run_id}: {str(e)}",
                exc_info=True,
            )
            raise
        finally:
            await self._close_connection_pool()

    async def _download_csv(self, download_url: str) -> str:
        response = requests.get(download_url, stream=True, timeout=60)
        response.raise_for_status()

        temp_file = tempfile.NamedTemporaryFile(
            mode="wb", delete=False, suffix=".csv"
        )
        temp_path = temp_file.name
        temp_file.close()

        with open(temp_path, "wb") as file_handle:
            for chunk in response.iter_content(chunk_size=8192):
                file_handle.write(chunk)
        
        return temp_path

    async def _parse_csv_data(self, csv_path: str) -> List[Dict[str, Any]]:
        try:
            tweets_data: List[Dict[str, Any]] = []
            chunk_size = 100

            for chunk_df in pd.read_csv(
                csv_path, encoding="utf-8", chunksize=chunk_size
            ):
                for idx, row in chunk_df.iterrows():
                    try:
                        json_data = {}
                        json_column = row.get("JSON")
                        if json_column and pd.notna(json_column) and str(json_column).strip():
                            try:
                                json_data = json.loads(str(json_column))
                            except (json.JSONDecodeError, ValueError):
                                json_data = {}

                        tweet_id = row.get("ORIGINAL TWEET ID") or row.get(
                            "INTERNAL UNIQUE ID"
                        )
                        external_id = row.get("ID")

                        if pd.isna(tweet_id) or not tweet_id:
                            tweet_id = row.get("INTERNAL UNIQUE ID")
                        if pd.isna(tweet_id) or not tweet_id:
                            tweet_id = f"tweet_{idx}_{int(datetime.utcnow().timestamp())}"

                        if pd.isna(external_id) or not external_id:
                            external_id = f"ext_{idx}_{int(datetime.utcnow().timestamp())}"

                        tweet_id = str(tweet_id)
                        external_id = str(external_id)

                        created_at = pd.to_datetime(row.get("PUBLISHED AT"))
                        fetched_at = pd.to_datetime(row.get("COLLECTED AT"))

                        if created_at.tz is None:
                            created_at = created_at.tz_localize("UTC")
                        else:
                            created_at = created_at.tz_convert("UTC")

                        if fetched_at.tz is None:
                            fetched_at = fetched_at.tz_localize("UTC")
                        else:
                            fetched_at = fetched_at.tz_convert("UTC")

                        created_at = created_at.tz_convert("UTC").replace(tzinfo=None)
                        fetched_at = fetched_at.tz_convert("UTC").replace(tzinfo=None)

                        content_text = str(row.get("CONTENT", ""))

                        tweet_url = row.get("TWEET URL") or row.get("ORIGINAL TWEET URL")
                        urls = self._extract_urls_from_content(content_text, json_data, tweet_url)
                        symbols = self._extract_symbols(content_text, json_data)

                        tweet_data = {
                            "tweet_id": tweet_id,
                            "external_id": external_id,
                            "source": "lobstr",
                            "author_id": str(row.get("USER ID", "")),
                            "author_handle": str(row.get("USERNAME", "")),
                            "text": content_text,
                            "lang": "en",
                            "created_at": created_at,
                            "fetched_at": fetched_at,
                            "is_reply": bool(row.get("IN REPLY TO SCREEN NAME")),
                            "is_retweet": str(row.get("IS RETWEETED", "")).upper()
                            == "TRUE",
                            "public_metrics": {
                                "views": int(row.get("VIEWS COUNT", 0) or 0),
                                "retweets": int(row.get("RETWEET COUNT", 0) or 0),
                                "likes": int(row.get("LIKES", 0) or 0),
                                "quotes": int(row.get("QUOTE COUNT", 0) or 0),
                                "replies": int(row.get("REPLY COUNT", 0) or 0),
                                "bookmarks": int(row.get("BOOKMARKS COUNT", 0) or 0),
                            },
                            "urls": urls,
                            "symbols": symbols,
                        }

                        tweets_data.append(tweet_data)
                    except Exception as e:
                        continue

            return tweets_data
        finally:
            try:
                os.unlink(csv_path)
            except OSError:
                pass

    async def _save_tweets_to_database(
        self,
        pool,
        tweets_data: List[Dict[str, Any]],
        schedule_id: str,
        run_id: str,
    ) -> Dict[str, Any]:
        async with pool.acquire() as conn:
            schedule = await self._get_or_create_schedule(conn, schedule_id)
            await self._create_or_update_run_record(
                conn, schedule["id"], run_id, len(tweets_data)
            )

            processed_count = 0
            duplicates_skipped = 0
            batch_size = 50

            for batch_start in range(0, len(tweets_data), batch_size):
                batch_end = min(batch_start + batch_size, len(tweets_data))
                batch_tweets = tweets_data[batch_start:batch_end]
                batch_result = await self._process_tweet_batch(
                    conn, batch_tweets, schedule_id, run_id
                )
                processed_count += batch_result["processed_count"]
                duplicates_skipped += batch_result["duplicates_skipped"]

            await conn.execute(
                """
                UPDATE "LobstrRun"
                SET "tweetsProcessed" = $1, "tweetsDropped" = $2, "completedAt" = $3, "updatedAt" = $4
                WHERE "runId" = $5
                """,
                processed_count,
                duplicates_skipped,
                datetime.utcnow(),
                datetime.utcnow(),
                run_id,
            )

            return {
                "processed_count": processed_count,
                "duplicates_skipped": duplicates_skipped,
            }

    async def _get_or_create_schedule(self, conn, schedule_id: str) -> Dict[str, Any]:
        schedule = await conn.fetchrow(
            'SELECT * FROM "LobstrSchedule" WHERE "scheduleId" = $1',
            schedule_id,
        )
        if not schedule:
            schedule = await conn.fetchrow(
                """
                INSERT INTO "LobstrSchedule" ("scheduleId","name","isActive","timezone","lookbackHours")
                VALUES ($1,$2,$3,$4,$5)
                RETURNING *
                """,
                schedule_id,
                f"Schedule {schedule_id}",
                True,
                "Asia/Jerusalem",
                4,
            )
        return dict(schedule)

    async def _create_or_update_run_record(
        self,
        conn,
        schedule_db_id: int,
        run_id: str,
        tweets_count: int,
    ) -> Dict[str, Any]:
        existing_run = await conn.fetchrow(
            'SELECT * FROM "LobstrRun" WHERE "runId" = $1', run_id
        )

        if existing_run:
            await conn.execute(
                'DELETE FROM "TweetRaw" WHERE "runId" = $1',
                run_id,
            )
            run_record = await conn.fetchrow(
                """
                UPDATE "LobstrRun"
                SET "tweetsFetched" = $1, "status" = $2, "updatedAt" = $3, "tweetsProcessed" = 0, "tweetsDropped" = 0
                WHERE "runId" = $4
                RETURNING *
                """,
                tweets_count,
                "completed",
                datetime.utcnow(),
                run_id,
            )
        else:
            run_record = await conn.fetchrow(
                """
                INSERT INTO "LobstrRun" (
                    "scheduleId","runId","runType","status","windowStart","windowEnd",
                    "tweetsFetched","tweetsProcessed","tweetsDropped","startedAt","completedAt","updatedAt"
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
                RETURNING *
                """,
                schedule_db_id,
                run_id,
                "auto",
                "completed",
                datetime.utcnow(),
                datetime.utcnow(),
                tweets_count,
                0,
                0,
                datetime.utcnow(),
                None,
                datetime.utcnow(),
            )
        return dict(run_record)

    async def _process_tweet_batch(
        self,
        conn,
        batch_tweets: List[Dict[str, Any]],
        schedule_id: str,
        run_id: str,
    ) -> Dict[str, Any]:
        tweet_ids = [tweet["tweet_id"] for tweet in batch_tweets]
        external_ids = [tweet["external_id"] for tweet in batch_tweets]

        existing_tweets = await conn.fetch(
            """
            SELECT "tweetId","externalId" FROM "TweetRaw"
            WHERE "tweetId" = ANY($1) OR ("externalId" = ANY($2) AND "source" = 'lobstr')
            """,
            tweet_ids,
            external_ids,
        )

        existing_tweet_ids = {row["tweetId"] for row in existing_tweets}
        existing_external_ids = {
            row["externalId"] for row in existing_tweets if row["externalId"]
        }

        new_tweets = []
        duplicates_skipped = 0

        for tweet_data in batch_tweets:
            if (
                tweet_data["tweet_id"] in existing_tweet_ids
                or (
                    tweet_data["external_id"]
                    and tweet_data["external_id"] in existing_external_ids
                )
            ):
                duplicates_skipped += 1
                continue

            new_tweets.append(tweet_data)

        if not new_tweets:
            return {
                "processed_count": 0,
                "duplicates_skipped": duplicates_skipped,
            }

        values = [
            (
                schedule_id,
                run_id,
                tweet_data["tweet_id"],
                tweet_data["external_id"],
                tweet_data["source"],
                tweet_data["author_id"],
                tweet_data["author_handle"],
                tweet_data["text"],
                tweet_data["lang"],
                tweet_data["created_at"],
                tweet_data["fetched_at"],
                tweet_data["is_reply"],
                tweet_data["is_retweet"],
                json.dumps(tweet_data["public_metrics"]),
                json.dumps(tweet_data["urls"]),
                tweet_data["symbols"],
            )
            for tweet_data in new_tweets
        ]

        await conn.executemany(
            """
            INSERT INTO "TweetRaw" (
                "scheduleId","runId","tweetId","externalId","source","authorId","authorHandle",
                "text","lang","createdAt","fetchedAt","isReply","isRetweet",
                "publicMetrics","urls","symbols"
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            """,
            values,
        )

        return {
            "processed_count": len(new_tweets),
            "duplicates_skipped": duplicates_skipped,
        }

    def _extract_urls_from_content(
        self, content: str, json_data: Dict[str, Any], tweet_url: Any = None
    ) -> List[str]:
        urls = []
        
        if tweet_url is not None:
            try:
                import pandas as pd
                if pd.notna(tweet_url) and str(tweet_url).strip():
                    urls.append(str(tweet_url).strip())
            except (ImportError, AttributeError):
                if tweet_url and str(tweet_url).strip():
                    urls.append(str(tweet_url).strip())
        
        if isinstance(json_data, dict):
            legacy_entities = json_data.get("legacy", {}).get("entities", {})
            if legacy_entities:
                urls_list = legacy_entities.get("urls", [])
                if isinstance(urls_list, list):
                    for url_item in urls_list:
                        if isinstance(url_item, dict):
                            url = (
                                url_item.get("expanded_url")
                                or url_item.get("url")
                                or url_item.get("display_url")
                            )
                            if url:
                                urls.append(url)
                        elif isinstance(url_item, str):
                            urls.append(url_item)

            if not urls:
                entities = json_data.get("entities", {})
                if entities:
                    urls_list = entities.get("urls", [])
                    if isinstance(urls_list, list):
                        for url_item in urls_list:
                            if isinstance(url_item, dict):
                                url = (
                                    url_item.get("expanded_url")
                                    or url_item.get("url")
                                    or url_item.get("display_url")
                                )
                                if url:
                                    urls.append(url)
                            elif isinstance(url_item, str):
                                urls.append(url_item)

            if not urls:
                direct_urls = json_data.get("urls", [])
                if isinstance(direct_urls, list):
                    urls.extend([str(u) for u in direct_urls if u])

        if not urls and content:
            url_regex = r"https?://t\.co/[a-zA-Z0-9]+"
            matches = re.findall(url_regex, content)
            urls.extend(matches)

        return list(set(urls))

    def _extract_symbols(
        self, text: str, json_data: Dict[str, Any] = None
    ) -> List[str]:
        symbols = []
        
        if text:
            symbol_regex = r"\$([A-Z]{1,5})"
            matches = re.findall(symbol_regex, text)
            symbols.extend([m.upper() for m in matches])

        if not symbols and isinstance(json_data, dict):
            json_symbols = []
            legacy_entities = json_data.get("legacy", {}).get("entities", {})
            if legacy_entities:
                symbols_list = legacy_entities.get("symbols", [])
                if isinstance(symbols_list, list):
                    for sym_item in symbols_list:
                        if isinstance(sym_item, dict):
                            symbol = sym_item.get("text") or sym_item.get("symbol")
                            if symbol:
                                json_symbols.append(str(symbol).upper().strip())
                        elif isinstance(sym_item, str):
                            json_symbols.append(str(sym_item).upper().strip())

            if not json_symbols:
                entities = json_data.get("entities", {})
                if entities:
                    symbols_list = entities.get("symbols", [])
                    if isinstance(symbols_list, list):
                        for sym_item in symbols_list:
                            if isinstance(sym_item, dict):
                                symbol = sym_item.get("text") or sym_item.get("symbol")
                                if symbol:
                                    json_symbols.append(str(symbol).upper().strip())
                            elif isinstance(sym_item, str):
                                json_symbols.append(str(sym_item).upper().strip())

            if json_symbols:
                symbols.extend(json_symbols)

        return list(set(symbols))

