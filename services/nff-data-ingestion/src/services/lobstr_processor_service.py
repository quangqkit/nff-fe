import pandas as pd
import requests
import tempfile
import os
import json
from typing import Dict, Any, List
from datetime import datetime
from utils.logger import get_logger
from core.monitoring import monitor, ErrorCategory

logger = get_logger(__name__)

class LobstrProcessorService:
    
    def __init__(self):
        import os
        from config import settings
        self.db_url = settings.DATABASE_URL
        self._pool = None
        logger.info(f"[DEBUG] Using database URL: {self.db_url}")
    
    async def _get_connection_pool(self):
        if self._pool is None:
            import asyncpg
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
        
    async def process_lobstr_csv(
        self, 
        download_url: str, 
        schedule_id: str, 
        run_id: str
    ) -> Dict[str, Any]:
        start_time = datetime.utcnow()
        try:
            logger.info(f"[DEBUG] Starting Lobstr CSV processing for run {run_id}")
            logger.info(f"[DEBUG] Download URL: {download_url}")
            logger.info(f"[DEBUG] Schedule ID: {schedule_id}")
            
            download_start = datetime.utcnow()
            logger.info(f"[DEBUG] Downloading CSV file...")
            csv_data = await self._download_csv(download_url)
            download_time = (datetime.utcnow() - download_start).total_seconds()
            logger.info(f"[DEBUG] CSV downloaded successfully in {download_time:.2f}s: {csv_data}")
            
            parse_start = datetime.utcnow()
            logger.info(f"[DEBUG] Parsing CSV data...")
            tweets_data = await self._parse_csv_data(csv_data)
            parse_time = (datetime.utcnow() - parse_start).total_seconds()
            logger.info(f"[DEBUG] Parsed {len(tweets_data)} tweets from CSV in {parse_time:.2f}s")
            
            db_start = datetime.utcnow()
            logger.info(f"[DEBUG] Saving tweets to database...")
            result = await self._save_tweets_to_database(
                tweets_data, 
                schedule_id, 
                run_id
            )
            db_time = (datetime.utcnow() - db_start).total_seconds()
            
            total_time = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(f"[DEBUG] Successfully processed {result['processed_count']} tweets for run {run_id}")
            logger.info(f"[DEBUG] Duplicates skipped: {result['duplicates_skipped']}")
            logger.info(f"[DEBUG] Performance metrics:")
            logger.info(f"[DEBUG] - Total time: {total_time:.2f}s")
            logger.info(f"[DEBUG] - Download time: {download_time:.2f}s")
            logger.info(f"[DEBUG] - Parse time: {parse_time:.2f}s")
            logger.info(f"[DEBUG] - Database time: {db_time:.2f}s")
            logger.info(f"[DEBUG] - Throughput: {len(tweets_data)/total_time:.2f} tweets/sec")
            
            result['performance_metrics'] = {
                'total_time': total_time,
                'download_time': download_time,
                'parse_time': parse_time,
                'db_time': db_time,
                'throughput_tweets_per_sec': len(tweets_data)/total_time if total_time > 0 else 0
            }
            
            return result
            
        except Exception as e:
            total_time = (datetime.utcnow() - start_time).total_seconds()
            logger.error(f"[DEBUG] Failed to process Lobstr CSV after {total_time:.2f}s: {str(e)}")
            raise Exception(f"Failed to process Lobstr CSV: {str(e)}")
        finally:
            await self._close_connection_pool()
    
    async def _download_csv(self, download_url: str) -> str:

        try:
            logger.info(f"[DEBUG] Downloading CSV from: {download_url}")
            
            response = requests.get(download_url, stream=True)
            response.raise_for_status()
            logger.info(f"[DEBUG] HTTP response status: {response.status_code}")
            
            temp_file = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv')
            temp_path = temp_file.name
            temp_file.close()
            logger.info(f"[DEBUG] Created temporary file: {temp_path}")
            
            chunk_count = 0
            with open(temp_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    chunk_count += 1
                    if chunk_count % 100 == 0:
                        logger.info(f"[DEBUG] Downloaded {chunk_count} chunks...")
            
            logger.info(f"[DEBUG] CSV downloaded successfully: {temp_path} ({chunk_count} chunks)")
            return temp_path
            
        except Exception as e:
            logger.error(f"[DEBUG] Failed to download CSV: {str(e)}")
            raise Exception(f"Failed to download CSV: {str(e)}")
    
    async def _parse_csv_data(self, csv_path: str) -> List[Dict[str, Any]]:
        try:
            logger.info(f"[DEBUG] Parsing CSV data from: {csv_path}")
            
            chunk_size = 100
            tweets_data = []
            parse_errors = 0
            total_rows = 0
            
            for chunk_df in pd.read_csv(csv_path, encoding='utf-8', chunksize=chunk_size):
                total_rows += len(chunk_df)
                logger.info(f"[DEBUG] Processing chunk with {len(chunk_df)} rows (total: {total_rows})")
                
                for idx, row in chunk_df.iterrows():
                    try:
                        json_data = json.loads(row.get('JSON', '{}'))
                        
                        tweet_id = row.get('ORIGINAL TWEET ID') or row.get('INTERNAL UNIQUE ID')
                        external_id = row.get('ID') 
                        
                        if pd.isna(tweet_id) or tweet_id == 'nan' or tweet_id == '':
                            tweet_id = row.get('INTERNAL UNIQUE ID')
                            if pd.isna(tweet_id) or tweet_id == 'nan' or tweet_id == '':
                                tweet_id = f"tweet_{idx}_{int(datetime.utcnow().timestamp())}"
                        
                        if pd.isna(external_id) or external_id == 'nan' or external_id == '':
                            external_id = f"ext_{idx}_{int(datetime.utcnow().timestamp())}"
                        
                        tweet_id = str(tweet_id)
                        external_id = str(external_id)
                        
                        created_at = pd.to_datetime(row.get('PUBLISHED AT'))
                        fetched_at = pd.to_datetime(row.get('COLLECTED AT'))
                        
                        if created_at.tz is None:
                            created_at = created_at.tz_localize('UTC')
                        else:
                            created_at = created_at.tz_convert('UTC')
                            
                        if fetched_at.tz is None:
                            fetched_at = fetched_at.tz_localize('UTC')
                        else:
                            fetched_at = fetched_at.tz_convert('UTC')
                        
                        created_at = created_at.tz_convert('UTC')
                        fetched_at = fetched_at.tz_convert('UTC')
                        
                        created_at = created_at.replace(tzinfo=None)
                        fetched_at = fetched_at.replace(tzinfo=None)
                        
                        tweet_data = {
                            'tweet_id': tweet_id,
                            'external_id': external_id,
                            'source': 'lobstr', 
                            'author_id': str(row.get('USER ID', '')),
                            'author_handle': str(row.get('USERNAME', '')),
                            'text': str(row.get('CONTENT', '')),
                            'lang': 'en',
                            'created_at': created_at,
                            'fetched_at': fetched_at,
                            'is_reply': bool(row.get('IN REPLY TO SCREEN NAME')),
                            'is_retweet': row.get('IS RETWEETED') == 'TRUE',
                            'public_metrics': {
                                'views': int(row.get('VIEWS COUNT', 0) or 0),
                                'retweets': int(row.get('RETWEET COUNT', 0) or 0),
                                'likes': int(row.get('LIKES', 0) or 0),
                                'quotes': int(row.get('QUOTE COUNT', 0) or 0),
                                'replies': int(row.get('REPLY COUNT', 0) or 0),
                                'bookmarks': int(row.get('BOOKMARKS COUNT', 0) or 0)
                            },
                            'urls': json_data.get('legacy', {}).get('entities', {}).get('urls', []),
                            'symbols': self._extract_symbols(row.get('CONTENT', ''))
                        }
                        
                        tweets_data.append(tweet_data)
                        
                    except Exception as e:
                        parse_errors += 1
                        logger.warning(f"[DEBUG] Failed to parse row {idx}: {str(e)}")
                        continue
                
                logger.info(f"[DEBUG] Chunk processed, total tweets so far: {len(tweets_data)}")
            
            logger.info(f"[DEBUG] Parsed {len(tweets_data)} tweets from {total_rows} CSV rows")
            logger.info(f"[DEBUG] Parse errors: {parse_errors}")
            return tweets_data
            
        except Exception as e:
            logger.error(f"[DEBUG] Failed to parse CSV data: {str(e)}")
            raise Exception(f"Failed to parse CSV data: {str(e)}")
        finally:
            try:
                os.unlink(csv_path)
                logger.info(f"[DEBUG] Cleaned up temporary file: {csv_path}")
            except:
                pass
    
    async def _save_tweets_to_database(
        self, 
        tweets_data: List[Dict[str, Any]], 
        schedule_id: str, 
        run_id: str
    ) -> Dict[str, Any]:
        try:
            pool = await self._get_connection_pool()
            
            logger.info(f"[DEBUG] Getting connection from pool...")
            async with pool.acquire() as conn:
                logger.info(f"[DEBUG] Database connection acquired from pool")
                
                logger.info(f"[DEBUG] Getting or creating schedule: {schedule_id}")
                schedule = await self._get_or_create_schedule(conn, schedule_id)
                logger.info(f"[DEBUG] Schedule ID: {schedule['id']}")
                
                logger.info(f"[DEBUG] Creating/updating run record for {run_id}")
                run_record = await self._create_or_update_run_record(conn, schedule['id'], run_id, len(tweets_data))
                logger.info(f"[DEBUG] Run record processed")
                
                processed_count = 0
                duplicates_skipped = 0
                save_errors = 0
                
                logger.info(f"[DEBUG] Processing {len(tweets_data)} tweets in batches...")
                
                batch_size = 50
                for batch_start in range(0, len(tweets_data), batch_size):
                    batch_end = min(batch_start + batch_size, len(tweets_data))
                    batch_tweets = tweets_data[batch_start:batch_end]
                    
                    logger.info(f"[DEBUG] Processing batch {batch_start//batch_size + 1}: tweets {batch_start}-{batch_end-1}")
                    
                    batch_result = await self._process_tweet_batch(conn, batch_tweets, schedule_id, run_id)
                    
                    processed_count += batch_result['processed_count']
                    duplicates_skipped += batch_result['duplicates_skipped']
                    save_errors += batch_result['save_errors']
                    
                    logger.info(f"[DEBUG] Batch completed: processed {batch_result['processed_count']}, skipped {batch_result['duplicates_skipped']}, errors {batch_result['save_errors']}")
                
                logger.info(f"[DEBUG] All batches completed: total processed {processed_count}, skipped {duplicates_skipped}, errors {save_errors}")
                
                logger.info(f"[DEBUG] Updating run record...")
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
                    run_id
                )
                
                result = {
                    'processed_count': processed_count,
                    'duplicates_skipped': duplicates_skipped,
                    'run_id': run_id,
                    'schedule_id': schedule_id
                }
                
                logger.info(f"[DEBUG] Database save completed: {result}")
                logger.info(f"[DEBUG] Save errors: {save_errors}")
                return result
                
        except Exception as e:
            logger.error(f"[DEBUG] Failed to save tweets to database: {str(e)}")
            raise Exception(f"Failed to save tweets to database: {str(e)}")
    
    async def _get_or_create_schedule(self, conn, schedule_id: str) -> Dict[str, Any]:
        schedule = await conn.fetchrow(
            "SELECT * FROM \"LobstrSchedule\" WHERE \"scheduleId\" = $1",
            schedule_id
        )
        
        if not schedule:
            schedule = await conn.fetchrow(
                """
                INSERT INTO "LobstrSchedule" ("scheduleId", "name", "isActive", "timezone", "lookbackHours")
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
                """,
                schedule_id,
                f"Schedule {schedule_id}",
                True,
                "Asia/Jerusalem",
                4
            )
            logger.info(f"[DEBUG] Created new schedule: {schedule_id}")
        else:
            logger.info(f"[DEBUG] Found existing schedule: {schedule_id}")
        
        return dict(schedule)
    
    async def _create_or_update_run_record(self, conn, schedule_db_id: int, run_id: str, tweets_count: int) -> Dict[str, Any]:
        existing_run = await conn.fetchrow(
            """
            SELECT * FROM "LobstrRun" WHERE "runId" = $1
            """,
            run_id
        )
        
        if existing_run:
            logger.info(f"[DEBUG] Found existing run {run_id}, updating...")
            await conn.execute(
                """
                DELETE FROM "TweetRaw" WHERE "runId" = $1
                """,
                run_id
            )
            logger.info(f"[DEBUG] Cleared existing tweets for run {run_id}")
            
            run_record = await conn.fetchrow(
                """
                UPDATE "LobstrRun" 
                SET "tweetsFetched" = $1, "status" = $2, "updatedAt" = $3, "tweetsProcessed" = 0, "tweetsDropped" = 0
                WHERE "runId" = $4
                RETURNING *
                """,
                tweets_count,
                'completed',
                datetime.utcnow(),
                run_id
            )
            logger.info(f"[DEBUG] Updated existing run: {run_id}")
        else:
            logger.info(f"[DEBUG] Creating new run: {run_id}")
            run_record = await conn.fetchrow(
                """
                INSERT INTO "LobstrRun" (
                    "scheduleId", "runId", "runType", "status", "windowStart", "windowEnd",
                    "tweetsFetched", "tweetsProcessed", "tweetsDropped", "startedAt", "completedAt", "updatedAt"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
                """,
                schedule_db_id,
                run_id,
                'auto',
                'completed',
                datetime.utcnow(),
                datetime.utcnow(),
                tweets_count,
                0,
                0,
                datetime.utcnow(),
                None,
                datetime.utcnow()
            )
            logger.info(f"[DEBUG] Created new run: {run_id}")
        
        return dict(run_record)
    
    def _extract_symbols(self, text: str) -> List[str]:
        import re
        symbol_regex = r'\$([A-Z]{1,5})'
        matches = re.findall(symbol_regex, text)
        return matches
    
    async def _process_tweet_batch(self, conn, batch_tweets: List[Dict[str, Any]], schedule_id: str, run_id: str) -> Dict[str, Any]:
        try:
            tweet_ids = [tweet['tweet_id'] for tweet in batch_tweets]
            external_ids = [tweet['external_id'] for tweet in batch_tweets]
            
            existing_tweets = await conn.fetch(
                """
                SELECT "tweetId", "externalId" FROM "TweetRaw" 
                WHERE "tweetId" = ANY($1) OR ("externalId" = ANY($2) AND "source" = 'lobstr')
                """,
                tweet_ids,
                external_ids
            )
            
            existing_tweet_ids = {row['tweetId'] for row in existing_tweets}
            existing_external_ids = {row['externalId'] for row in existing_tweets if row['externalId']}
            
            new_tweets = []
            duplicates_skipped = 0
            
            for tweet_data in batch_tweets:
                if (tweet_data['tweet_id'] in existing_tweet_ids or 
                    (tweet_data['external_id'] and tweet_data['external_id'] in existing_external_ids)):
                    duplicates_skipped += 1
                    continue
                
                new_tweets.append(tweet_data)
            
            if not new_tweets:
                return {
                    'processed_count': 0,
                    'duplicates_skipped': duplicates_skipped,
                    'save_errors': 0
                }
            
            values = []
            for tweet_data in new_tweets:
                values.append((
                    schedule_id,
                    run_id,
                    tweet_data['tweet_id'],
                    tweet_data['external_id'],
                    tweet_data['source'],
                    tweet_data['author_id'],
                    tweet_data['author_handle'],
                    tweet_data['text'],
                    tweet_data['lang'],
                    tweet_data['created_at'],
                    tweet_data['fetched_at'],
                    tweet_data['is_reply'],
                    tweet_data['is_retweet'],
                    json.dumps(tweet_data['public_metrics']),
                    json.dumps(tweet_data['urls']),
                    tweet_data['symbols']
                ))
            
            await conn.executemany(
                """
                INSERT INTO "TweetRaw" (
                    "scheduleId", "runId", "tweetId", "externalId", "source", "authorId", "authorHandle",
                    "text", "lang", "createdAt", "fetchedAt", "isReply", "isRetweet",
                    "publicMetrics", "urls", "symbols"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                """,
                values
            )
            
            return {
                'processed_count': len(new_tweets),
                'duplicates_skipped': duplicates_skipped,
                'save_errors': 0
            }
            
        except Exception as e:
            logger.error(f"[DEBUG] Batch processing failed: {str(e)}")
            return {
                'processed_count': 0,
                'duplicates_skipped': 0,
                'save_errors': len(batch_tweets)
            }
