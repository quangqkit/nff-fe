"""
ETL Service
Handles data fetching, processing, and loading operations
"""

import psycopg2
from psycopg2.extras import RealDictCursor, execute_values
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from config import settings
import logging
import uuid
import asyncio
from core.data_fetcher import DataFetcherFactory
from core.ai_features import AIFeaturesCalculator

logger = logging.getLogger(__name__)

class ETLService:
    """Service for ETL operations"""
    
    def __init__(self):
        self.db_url = settings.DATABASE_URL
        self.data_fetcher_factory = DataFetcherFactory()
        self.ai_calculator = AIFeaturesCalculator()
    
    async def create_job(
        self,
        indicator_ids: Optional[List[int]] = None,
        category: Optional[str] = None,
        source: Optional[str] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Create an ETL job
        """
        job_id = f"ETL_{uuid.uuid4().hex[:12]}"
        started_at = datetime.now()
        
        indicators = await self._get_indicators_for_job(
            indicator_ids=indicator_ids,
            category=category,
            source=source,
            force_refresh=force_refresh
        )
        
        # Create job record
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "ETLJob" (
                        "jobId" VARCHAR(50) PRIMARY KEY,
                        status VARCHAR(20) NOT NULL,
                        "totalIndicators" INTEGER NOT NULL,
                        successful INTEGER DEFAULT 0,
                        failed INTEGER DEFAULT 0,
                        blocked INTEGER DEFAULT 0,
                        "startedAt" TIMESTAMP NOT NULL,
                        "completedAt" TIMESTAMP,
                        metadata JSONB,
                        "createdAt" TIMESTAMP DEFAULT NOW()
                    )
                """)
                
                cur.execute("""
                    INSERT INTO "ETLJob" ("jobId", status, "totalIndicators", "startedAt", metadata)
                    VALUES (%s, %s, %s, %s, %s)
                """, (job_id, 'PROCESSING', len(indicators), started_at, psycopg2.extras.Json({
                    'category': category,
                    'source': source,
                    'force_refresh': force_refresh,
                    'indicator_ids': indicator_ids
                })))
                
                conn.commit()
                
        except Exception as e:
            logger.error(f"Error creating ETL job: {e}")
            if 'conn' in locals():
                conn.rollback()
            raise
        finally:
            if 'conn' in locals():
                conn.close()
        
        return {
            "job_id": job_id,
            "status": "PROCESSING",
            "started_at": started_at.isoformat(),
            "total_indicators": len(indicators),
            "message": f"ETL job created with {len(indicators)} indicators"
        }
    
    async def process_job(self, job_id: str) -> None:
        """
        Process an ETL job (run in background)
        """
        try:
            job = await self._get_job(job_id)
            if not job:
                logger.error(f"Job {job_id} not found")
                return
            
            metadata = job['metadata']
            
            indicators = await self._get_indicators_for_job(
                indicator_ids=metadata.get('indicator_ids'),
                category=metadata.get('category'),
                source=metadata.get('source'),
                force_refresh=metadata.get('force_refresh', False)
            )
            
            successful = 0
            failed = 0
            blocked = 0
            
            total_indicators = len(indicators)
            logger.info(f"[ETL JOB] Starting to process {total_indicators} indicators for job {job_id}")
            
            for idx, indicator in enumerate(indicators, 1):
                indicator_id = indicator['id']
                indicator_name = indicator.get('indicatorEN', 'Unknown')
                etl_status = indicator.get('etlStatus', 'UNKNOWN')
                
                # Log progress every 50 indicators
                if idx % 50 == 0 or idx == 1:
                    logger.info(f"[ETL JOB] Progress: {idx}/{total_indicators} (Success: {successful}, Failed: {failed}, Blocked: {blocked})")
                
                try:
                    logger.debug(f"[ETL JOB] Processing indicator {idx}/{total_indicators}: ID={indicator_id}, Name='{indicator_name}', CurrentStatus={etl_status}")
                    
                    result = await self.fetch_indicator_data(
                        indicator_id=indicator_id,
                        force_refresh=metadata.get('force_refresh', False)
                    )
                    
                    if result['status'] == 'OK':
                        successful += 1
                        logger.debug(f"[ETL JOB] ✓ Indicator {indicator_id} ({indicator_name}) - SUCCESS")
                    elif result['status'] == 'BLOCKED':
                        blocked += 1
                        logger.debug(f"[ETL JOB] ⊗ Indicator {indicator_id} ({indicator_name}) - BLOCKED")
                    else:
                        failed += 1
                        logger.warning(f"[ETL JOB] ✗ Indicator {indicator_id} ({indicator_name}) - FAILED: {result.get('error_message', 'Unknown error')}")
                        
                except Exception as e:
                    logger.error(f"[ETL JOB] ✗ Error processing indicator {indicator_id} ({indicator_name}): {e}", exc_info=True)
                    failed += 1
                
                await asyncio.sleep(0.2)
            
            logger.info(f"[ETL JOB] Completed processing {total_indicators} indicators: Success={successful}, Failed={failed}, Blocked={blocked}")
            
            await self._update_job_status(
                job_id=job_id,
                status='COMPLETED',
                successful=successful,
                failed=failed,
                blocked=blocked
            )
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            await self._update_job_status(job_id=job_id, status='FAILED')
    
    async def fetch_indicator_data(
        self,
        indicator_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Fetch data for a single indicator
        """
        etl_log_id = await self._create_etl_log(indicator_id)
        
        try:
            indicator = await self._get_indicator_metadata(indicator_id)
            
            if not indicator:
                raise ValueError(f"Indicator {indicator_id} not found")
            
            validation_error = self._validate_indicator_api_config(indicator)
            if validation_error:
                raise ValueError(validation_error)
            
            if indicator.get('etlStatus') == 'PROCESSING':
                logger.warning(f"Indicator {indicator_id} is already in PROCESSING status - may be stuck")
                await self._update_indicator_etl_status(indicator_id, 'UNKNOWN', etl_notes="Reset from stuck PROCESSING status")
            
            await self._update_indicator_etl_status(indicator_id, 'PROCESSING')
            
            fetcher = self.data_fetcher_factory.get_fetcher(indicator['source'])
            
            if not fetcher:
                raise ValueError(f"No data fetcher available for source: {indicator['source']}")
            
            # Determine date range
            if not start_date:
                start_date = date(2000, 1, 1)
            if not end_date:
                end_date = date.today()
            
            # Fetch data with timeout protection
            import asyncio
            try:
                raw_data = await asyncio.wait_for(
                    fetcher.fetch(
                        series_id=indicator['seriesIDs'],
                        start_date=start_date,
                        end_date=end_date
                    ),
                    timeout=300  # 5 minutes timeout
                )
            except asyncio.TimeoutError:
                raise ValueError(f"Data fetch timeout for indicator {indicator_id} after 5 minutes")
            
            if not raw_data or len(raw_data) == 0:
                raise ValueError("No data returned from API")
            
            # Apply calculation if needed and keep both original + calculated
            has_calculation = bool(indicator.get('calculation'))
            calculated_data = None
            calculation_error = None
            
            if has_calculation:
                try:
                    # Apply calculation using calculation engine
                    calculated_data = await self._apply_calculation(
                        raw_data, 
                        indicator['calculation'], 
                        indicator['seriesIDs']
                    )
                    processed_data = calculated_data
                    logger.info(f"Applied calculation for indicator {indicator_id}: {indicator['calculation']}")
                except Exception as e:
                    calculation_error = str(e)
                    logger.error(f"Calculation failed for indicator {indicator_id}: {e}")
                    # Fall back to raw data if calculation fails
                    processed_data = raw_data
                    has_calculation = False
            else:
                # No calculation needed - use raw data directly
                processed_data = raw_data
                logger.info(f"Using raw data for indicator {indicator_id} (no calculation specified)")
            
            enriched_data = processed_data
            records_inserted = await self._save_time_series_data(
                indicator_id=indicator_id,
                data=enriched_data,
                original_data=raw_data if has_calculation else None,
                has_calculation=has_calculation,
                force_refresh=force_refresh
            )
            
            etl_notes = "Raw data only (calculation engine & AI features disabled)"
            
            await self._complete_etl_log(
                etl_log_id=etl_log_id,
                status='OK',
                records_processed=len(enriched_data),
                records_inserted=records_inserted
            )
            
            await self._update_indicator_etl_status(
                indicator_id=indicator_id,
                status='OK',
                records_count=records_inserted,
                last_successful_at=datetime.now(),
                etl_notes=etl_notes
            )
            
            return {
                "status": "OK",
                "indicator_id": indicator_id,
                "records_fetched": len(raw_data),
                "records_processed": len(enriched_data),
                "records_inserted": records_inserted,
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching indicator {indicator_id}: {e}")
            
            error_code = self._classify_error(e)
            error_category = self._get_error_category(error_code)
            
            await self._complete_etl_log(
                etl_log_id=etl_log_id,
                status='ERROR',
                error_code=error_code,
                error_message=str(e),
                error_category=error_category
            )
            
            await self._update_indicator_etl_status(
                indicator_id=indicator_id,
                status='ERROR',
                error_code=error_code,
                etl_notes=str(e)
            )
            
            return {
                "status": "ERROR",
                "indicator_id": indicator_id,
                "error_code": error_code,
                "error_message": str(e)
            }
    
    async def create_category_job(
        self,
        category_name: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        importance_min: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create job for fetching all indicators in a category
        """
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                if importance_min is not None:
                    query = """
                        SELECT im.id FROM "IndicatorMetadata" im
                        INNER JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                        WHERE cc.name = %s 
                        AND im."isActive" = true
                        AND im.importance >= %s
                    """
                    params = (category_name, importance_min)
                    logger.info(f"[ETL JOB] Creating category job for '{category_name}' with importance_min={importance_min}")
                else:
                    query = """
                        SELECT im.id FROM "IndicatorMetadata" im
                        INNER JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                        WHERE cc.name = %s 
                        AND im."isActive" = true
                    """
                    params = (category_name,)
                    logger.info(f"[ETL JOB] Creating category job for '{category_name}' - fetching ALL indicators (no importance filter)")
                
                cur.execute(query, params)
                
                indicators = cur.fetchall()
                indicator_ids = [ind['id'] for ind in indicators]
                
        finally:
            if 'conn' in locals():
                conn.close()
        
        job_id = f"CATEGORY_{uuid.uuid4().hex[:12]}"
        started_at = datetime.now()
        
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "ETLJob" (
                        "jobId" VARCHAR(50) PRIMARY KEY,
                        status VARCHAR(20) NOT NULL,
                        "totalIndicators" INTEGER NOT NULL,
                        successful INTEGER DEFAULT 0,
                        failed INTEGER DEFAULT 0,
                        blocked INTEGER DEFAULT 0,
                        "startedAt" TIMESTAMP NOT NULL,
                        "completedAt" TIMESTAMP,
                        metadata JSONB,
                        "createdAt" TIMESTAMP DEFAULT NOW()
                    )
                """)
                
                cur.execute("""
                    INSERT INTO "ETLJob" ("jobId", status, "totalIndicators", "startedAt", metadata)
                    VALUES (%s, %s, %s, %s, %s)
                """, (job_id, 'PROCESSING', len(indicator_ids), started_at, psycopg2.extras.Json({
                    'type': 'category_full',
                    'category': category_name,
                    'start_date': start_date.isoformat() if start_date else None,
                    'end_date': end_date.isoformat() if end_date else None,
                    'importance_min': importance_min,
                    'indicator_ids': indicator_ids
                })))
                
                conn.commit()
                
        finally:
            if 'conn' in locals():
                conn.close()
        
        return {
            "job_id": job_id,
            "status": "PROCESSING",
            "started_at": started_at.isoformat(),
            "total_indicators": len(indicator_ids),
            "message": f"Category job created for {category_name}"
        }
    
    async def process_category_job(self, job_id: str) -> None:
        """
        Process category job (full fetch)
        """
        try:
            job = await self._get_job(job_id)
            if not job:
                return
            
            metadata = job['metadata']
            indicator_ids = metadata.get('indicator_ids', [])
            start_date = None
            end_date = None
            
            if metadata.get('start_date'):
                start_date = datetime.fromisoformat(metadata['start_date']).date()
            if metadata.get('end_date'):
                end_date = datetime.fromisoformat(metadata['end_date']).date()
            
            successful = 0
            failed = 0
            blocked = 0
            
            for indicator_id in indicator_ids:
                try:
                    result = await self.fetch_indicator_data(
                        indicator_id=indicator_id,
                        start_date=start_date,
                        end_date=end_date,
                        force_refresh=False
                    )
                    
                    if result['status'] == 'OK':
                        successful += 1
                    elif result['status'] == 'BLOCKED':
                        blocked += 1
                    else:
                        failed += 1
                        
                except Exception as e:
                    logger.error(f"Error processing indicator {indicator_id}: {e}")
                    failed += 1
                
                await asyncio.sleep(0.2)
            
            await self._update_job_status(
                job_id=job_id,
                status='COMPLETED',
                successful=successful,
                failed=failed,
                blocked=blocked
            )
            
        except Exception as e:
            logger.error(f"Error processing category job {job_id}: {e}")
            await self._update_job_status(job_id=job_id, status='FAILED')
    
    async def create_incremental_job(
        self,
        category_name: str,
        days_back: int = 30
    ) -> Dict[str, Any]:
        """
        Create incremental fetch job (fetch recent data only)
        """
        job_id = f"INCR_{uuid.uuid4().hex[:12]}"
        started_at = datetime.now()
        
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT im.id, im."lastSuccessfulAt"
                    FROM "IndicatorMetadata" im
                    INNER JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                    WHERE cc.name = %s AND im."isActive" = true
                """, (category_name,))
                
                indicators = cur.fetchall()
                
        finally:
            if 'conn' in locals():
                conn.close()
        
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO "ETLJob" ("jobId", status, "totalIndicators", "startedAt", metadata)
                    VALUES (%s, %s, %s, %s, %s)
                """, (job_id, 'PROCESSING', len(indicators), started_at, psycopg2.extras.Json({
                    'type': 'incremental',
                    'category': category_name,
                    'days_back': days_back,
                    'indicators': [{'id': ind['id'], 'last_success': ind['lastSuccessfulAt'].isoformat() if ind['lastSuccessfulAt'] else None} for ind in indicators]
                })))
                
                conn.commit()
                
        finally:
            if 'conn' in locals():
                conn.close()
        
        return {
            "job_id": job_id,
            "status": "PROCESSING",
            "started_at": started_at.isoformat(),
            "total_indicators": len(indicators),
            "message": f"Incremental job created for {category_name}"
        }
    
    async def process_incremental_job(self, job_id: str) -> None:
        """
        Process incremental job
        """
        try:
            job = await self._get_job(job_id)
            if not job:
                return
            
            metadata = job['metadata']
            indicators = metadata.get('indicators', [])
            days_back = metadata.get('days_back', 30)
            
            successful = 0
            failed = 0
            blocked = 0
            
            for ind_info in indicators:
                try:
                    if ind_info['last_success']:
                        start_date = datetime.fromisoformat(ind_info['last_success']).date() + timedelta(days=1)
                    else:
                        start_date = date.today() - timedelta(days=days_back)
                    
                    end_date = date.today()
                    
                    if start_date >= end_date:
                        continue
                    
                    result = await self.fetch_indicator_data(
                        indicator_id=ind_info['id'],
                        start_date=start_date,
                        end_date=end_date,
                        force_refresh=False
                    )
                    
                    if result['status'] == 'OK':
                        successful += 1
                    elif result['status'] == 'BLOCKED':
                        blocked += 1
                    else:
                        failed += 1
                        
                except Exception as e:
                    logger.error(f"Error processing indicator {ind_info['id']}: {e}")
                    failed += 1
                
                await asyncio.sleep(0.2)
            
            await self._update_job_status(
                job_id=job_id,
                status='COMPLETED',
                successful=successful,
                failed=failed,
                blocked=blocked
            )
            
        except Exception as e:
            logger.error(f"Error processing incremental job {job_id}: {e}")
            await self._update_job_status(job_id=job_id, status='FAILED')
    
    async def get_indicator_time_series(
        self,
        indicator_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 1000
    ) -> List[Dict[str, Any]]:
        """
        Get time-series data for indicator
        """
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        date, value, "zScore", normalized,
                        "pctChange1m", "pctChange3m", "pctChange12m",
                        "ma30d", "ma90d", "ma365d",
                        "volatility30d", "volatility90d",
                        trend, "isOutlier"
                    FROM "IndicatorTimeSeries"
                    WHERE "indicatorMetadataId" = %s
                """
                
                params = [indicator_id]
                
                if start_date:
                    query += " AND date >= %s"
                    params.append(start_date)
                
                if end_date:
                    query += " AND date <= %s"
                    params.append(end_date)
                
                query += " ORDER BY date DESC LIMIT %s"
                params.append(limit)
                
                cur.execute(query, params)
                results = cur.fetchall()
                
                data = []
                for row in results:
                    item = dict(row)
                    item['date'] = item['date'].isoformat()
                    data.append(item)
                
                return data
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _get_indicators_for_job(
        self,
        indicator_ids: Optional[List[int]],
        category: Optional[str],
        source: Optional[str],
        force_refresh: bool
    ) -> List[Dict[str, Any]]:
        """Get indicators for ETL job"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT im.* FROM "IndicatorMetadata" im
                    LEFT JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                    WHERE im."isActive" = true
                """
                params = []
                
                if indicator_ids:
                    placeholders = ','.join(['%s'] * len(indicator_ids))
                    query += f" AND im.id IN ({placeholders})"
                    params.extend(indicator_ids)
                
                if category:
                    query += " AND cc.name = %s"
                    params.append(category)
                
                if source:
                    query += " AND im.source = %s"
                    params.append(source)
                
                count_query = query.replace('SELECT im.*', 'SELECT COUNT(*) as total')
                cur.execute(count_query, params)
                total_before_filter = cur.fetchone()['total']
                
                # Get status breakdown before filter
                status_query = query.replace('SELECT im.*', 'SELECT im."etlStatus", COUNT(*) as count')
                status_query += ' GROUP BY im."etlStatus"'
                cur.execute(status_query, params)
                status_breakdown = {row['etlStatus']: row['count'] for row in cur.fetchall()}
                
                if not force_refresh:
                    # Only include indicators that need update
                    query += """ AND (
                        im."etlStatus" IN ('UNKNOWN', 'ERROR') 
                        OR im."lastEtlRunAt" IS NULL
                        OR im."lastEtlRunAt" < NOW() - INTERVAL '7 days'
                    )"""
                
                cur.execute(query, params)
                indicators = [dict(row) for row in cur.fetchall()]
                
                # Get status breakdown after filter
                status_after_query = query.replace('SELECT im.*', 'SELECT im."etlStatus", COUNT(*) as count')
                status_after_query += ' GROUP BY im."etlStatus"'
                cur.execute(status_after_query, params)
                status_after_breakdown = {row['etlStatus']: row['count'] for row in cur.fetchall()}
                
                logger.info(f"[ETL QUERY] Total active indicators: {total_before_filter}")
                logger.info(f"[ETL QUERY] Status breakdown BEFORE filter: {status_breakdown}")
                logger.info(f"[ETL QUERY] After filter (UNKNOWN/ERROR or never fetched or >7 days old): {len(indicators)}")
                logger.info(f"[ETL QUERY] Status breakdown AFTER filter: {status_after_breakdown}")
                logger.info(f"[ETL QUERY] Filters - Category={category}, Source={source}, ForceRefresh={force_refresh}")
                
                return indicators
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _get_indicator_metadata(self, indicator_id: int) -> Optional[Dict[str, Any]]:
        """Get indicator metadata"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('SELECT * FROM "IndicatorMetadata" WHERE id = %s', (indicator_id,))
                result = cur.fetchone()
                return dict(result) if result else None
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    def _validate_indicator_api_config(self, indicator: Dict[str, Any]) -> Optional[str]:
        """
        Validate indicator API configuration before fetching data
        
        Returns:
            Error message if validation fails, None if valid
        """
        import re
        
        source = indicator.get('source', '').lower()
        series_ids = indicator.get('seriesIDs', '')
        api_example = indicator.get('apiExample', '')
        
        if 'polygon' in source:
            return "POLYGON_NOT_SUPPORTED: Polygon API is no longer available. Please update data source."
        
        if not series_ids or series_ids.strip() == '':
            return "INVALID_SERIES_ID: Series ID is empty. Cannot fetch data without valid series identifier."
        
        if api_example and api_example.strip():
            url_pattern = r'^https?://'
            if not re.match(url_pattern, api_example):
                return f"INVALID_API_URL: API example is not a valid URL. Found: '{api_example[:100]}...'"
        
        if 'fred' in source:
            series_list = [s.strip() for s in series_ids.split('|')]
            for series in series_list:
                if not series or not series.replace('_', '').replace('-', '').isalnum():
                    return f"INVALID_FRED_SERIES: Invalid FRED series ID format: '{series}'"
        
        return None
    
    async def _create_etl_log(self, indicator_id: int) -> int:
        """Create ETL log entry"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                job_id = f"LOG_{uuid.uuid4().hex[:12]}"
                
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS "IndicatorETLLog" (
                        id SERIAL PRIMARY KEY,
                        "indicatorId" INTEGER NOT NULL,
                        "jobId" VARCHAR(50) NOT NULL,
                        status VARCHAR(20) NOT NULL,
                        "errorCode" VARCHAR(50),
                        "errorMessage" TEXT,
                        "errorCategory" VARCHAR(50),
                        "recordsProcessed" INTEGER DEFAULT 0,
                        "recordsInserted" INTEGER DEFAULT 0,
                        "recordsUpdated" INTEGER DEFAULT 0,
                        "startedAt" TIMESTAMP,
                        "completedAt" TIMESTAMP,
                        "createdAt" TIMESTAMP DEFAULT NOW(),
                        metadata JSONB
                    )
                """)
                
                cur.execute("""
                    INSERT INTO "IndicatorETLLog" ("indicatorId", "jobId", status, "startedAt")
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                """, (indicator_id, job_id, 'PROCESSING', datetime.now()))
                
                etl_log_id = cur.fetchone()[0]
                conn.commit()
                
                return etl_log_id
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _complete_etl_log(
        self,
        etl_log_id: int,
        status: str,
        records_processed: int = 0,
        records_inserted: int = 0,
        error_code: Optional[str] = None,
        error_message: Optional[str] = None,
        error_category: Optional[str] = None
    ) -> None:
        """Complete ETL log"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE "IndicatorETLLog"
                    SET status = %s,
                        "recordsProcessed" = %s,
                        "recordsInserted" = %s,
                        "errorCode" = %s,
                        "errorMessage" = %s,
                        "errorCategory" = %s,
                        "completedAt" = %s
                    WHERE id = %s
                """, (status, records_processed, records_inserted, error_code, error_message, error_category, datetime.now(), etl_log_id))
                
                conn.commit()
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _update_indicator_etl_status(
        self,
        indicator_id: int,
        status: str,
        records_count: Optional[int] = None,
        last_successful_at: Optional[datetime] = None,
        error_code: Optional[str] = None,
        etl_notes: Optional[str] = None
    ) -> None:
        """Update indicator ETL status"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                updates = ['"etlStatus" = %s', '"lastEtlRunAt" = %s']
                params = [status, datetime.now()]
                
                if records_count is not None:
                    updates.append('"recordsCount" = %s')
                    params.append(records_count)
                
                if last_successful_at:
                    updates.append('"lastSuccessfulAt" = %s')
                    params.append(last_successful_at)
                
                if error_code:
                    updates.append('"etlStatusCode" = %s')
                    params.append(error_code)
                
                if etl_notes:
                    updates.append('"etlNotes" = %s')
                    params.append(etl_notes)
                
                params.append(indicator_id)
                
                cur.execute(f"""
                    UPDATE "IndicatorMetadata"
                    SET {', '.join(updates)}
                    WHERE id = %s
                """, params)
                
                conn.commit()
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _save_time_series_data(
        self,
        indicator_id: int,
        data: List[Dict[str, Any]],
        original_data: Optional[List[Dict[str, Any]]] = None,
        has_calculation: bool = False,
        force_refresh: bool = False
    ) -> int:
        """
        Save time-series data to database with dual value support
        
        Args:
            indicator_id: ID of the indicator
            data: Enriched data (with AI features) - this is the main value
            original_data: Original raw data from API (only if has_calculation=True)
            has_calculation: Whether this indicator has a calculation formula
            force_refresh: Whether to force refresh existing data
        """
        if not data:
            return 0
        
        original_lookup = {}
        if original_data and has_calculation:
            for item in original_data:
                original_lookup[item['date']] = item.get('value')
        
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                seen_dates = {}
                for item in data:
                    item_date = item['date']
                    seen_dates[item_date] = item  # Will overwrite duplicates
                
                deduplicated_data = list(seen_dates.values())
                
                if len(deduplicated_data) < len(data):
                    logger.warning(f"Removed {len(data) - len(deduplicated_data)} duplicate dates for indicator {indicator_id}")
                
                values = []
                for item in deduplicated_data:
                    item_date = item['date']
                    main_value = item.get('value')
                    
                    if has_calculation:
                        original_val = original_lookup.get(item_date)
                        calculated_val = main_value
                    else:
                        original_val = None
                        calculated_val = None
                    
                    values.append((
                        indicator_id,
                        item_date,
                        main_value,
                        original_val,
                        calculated_val,
                        has_calculation,
                        item.get('z_score'),
                        item.get('normalized'),
                        item.get('pct_change_1m'),
                        item.get('pct_change_3m'),
                        item.get('pct_change_12m'),
                        item.get('ma_30d'),
                        item.get('ma_90d'),
                        item.get('ma_365d'),
                        item.get('volatility_30d'),
                        item.get('volatility_90d'),
                        item.get('trend'),
                        item.get('is_outlier', False),
                        datetime.now(),
                        datetime.now()
                    ))
                
                execute_values(cur, """
                    INSERT INTO "IndicatorTimeSeries" (
                        "indicatorMetadataId", date, value,
                        "originalValue", "calculatedValue", "hasCalculation",
                        "zScore", normalized,
                        "pctChange1m", "pctChange3m", "pctChange12m",
                        "ma30d", "ma90d", "ma365d",
                        "volatility30d", "volatility90d",
                        trend, "isOutlier",
                        "createdAt", "updatedAt"
                    ) VALUES %s
                    ON CONFLICT ("indicatorMetadataId", date)
                    DO UPDATE SET
                        value = EXCLUDED.value,
                        "originalValue" = EXCLUDED."originalValue",
                        "calculatedValue" = EXCLUDED."calculatedValue",
                        "hasCalculation" = EXCLUDED."hasCalculation",
                        "zScore" = EXCLUDED."zScore",
                        normalized = EXCLUDED.normalized,
                        "pctChange1m" = EXCLUDED."pctChange1m",
                        "pctChange3m" = EXCLUDED."pctChange3m",
                        "pctChange12m" = EXCLUDED."pctChange12m",
                        "ma30d" = EXCLUDED."ma30d",
                        "ma90d" = EXCLUDED."ma90d",
                        "ma365d" = EXCLUDED."ma365d",
                        "volatility30d" = EXCLUDED."volatility30d",
                        "volatility90d" = EXCLUDED."volatility90d",
                        trend = EXCLUDED.trend,
                        "isOutlier" = EXCLUDED."isOutlier",
                        "updatedAt" = EXCLUDED."updatedAt"
                """, values)
                
                conn.commit()
                return len(values)
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _apply_calculation(
        self,
        raw_data: List[Dict[str, Any]],
        calculation: str,
        series_ids: str
    ) -> List[Dict[str, Any]]:
        """Apply calculation logic"""
        import pandas as pd
        from core.calculation_engine import CalculationEngine
        calculation_engine = CalculationEngine()
        
        if '|' in series_ids:
            series_list = [s.strip() for s in series_ids.split('|')]
            series_data = {}
            
            for series_id in series_list:
                series_records = [record for record in raw_data if record.get('series_id') == series_id]
                if series_records:
                    df = pd.DataFrame(series_records)
                    series_data[series_id] = df
                    logger.info(f"Prepared {len(series_records)} records for series {series_id}")
                else:
                    logger.warning(f"No data found for series {series_id}")
            
            if not series_data:
                raise ValueError("No data available for any of the specified series")
                
        else:
            df = pd.DataFrame(raw_data)
            series_data = {series_ids.strip(): df}
        
        result = calculation_engine.process_calculation(calculation, series_data, "indicator")
        
        if result.success and result.data is not None:
            if isinstance(result.data, pd.DataFrame):
                return result.data.to_dict('records')
            else:
                return result.data
        else:
            raise ValueError(f"Calculation failed: {result.error_message}")
    
    def _classify_error(self, error: Exception) -> str:
        """Classify error and return error code"""
        error_str = str(error).lower()
        
        if 'api key' in error_str or 'authentication' in error_str:
            return 'API_AUTHENTICATION_FAILED'
        elif 'rate limit' in error_str:
            return 'API_RATE_LIMIT'
        elif 'timeout' in error_str:
            return 'API_TIMEOUT'
        elif 'not found' in error_str or '404' in error_str:
            return 'API_NOT_FOUND'
        elif 'bad request' in error_str or '400' in error_str:
            return 'API_BAD_REQUEST'
        elif 'no data' in error_str or 'empty' in error_str:
            return 'DATA_EMPTY'
        elif 'calculation' in error_str:
            return 'CALCULATION_FAILED'
        else:
            return 'UNEXPECTED_ERROR'
    
    def _get_error_category(self, error_code: str) -> str:
        """Get error category from error code"""
        if error_code.startswith('API_'):
            return 'API_ERROR'
        elif error_code.startswith('DATA_'):
            return 'DATA_ERROR'
        elif error_code.startswith('CALCULATION_'):
            return 'CALC_ERROR'
        elif error_code.startswith('MISSING_') or error_code.startswith('INVALID_'):
            return 'CONFIG_ERROR'
        else:
            return 'SYSTEM_ERROR'
    
    async def _get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job by ID"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute('SELECT * FROM "ETLJob" WHERE "jobId" = %s', (job_id,))
                result = cur.fetchone()
                return dict(result) if result else None
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def _update_job_status(
        self,
        job_id: str,
        status: str,
        successful: int = 0,
        failed: int = 0,
        blocked: int = 0
    ) -> None:
        """Update job status"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE "ETLJob"
                    SET status = %s,
                        successful = %s,
                        failed = %s,
                        blocked = %s,
                        "completedAt" = %s
                    WHERE "jobId" = %s
                """, (status, successful, failed, blocked, datetime.now(), job_id))
                
                conn.commit()
                
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job result"""
        job = await self._get_job(job_id)
        
        if not job:
            return None
        
        duration = None
        if job.get('completedAt') and job.get('startedAt'):
            duration = (job['completedAt'] - job['startedAt']).total_seconds()
        
        return {
            "job_id": job['jobId'],
            "status": job['status'],
            "total_indicators": job['totalIndicators'],
            "successful": job.get('successful', 0),
            "failed": job.get('failed', 0),
            "blocked": job.get('blocked', 0),
            "details": [],
            "started_at": job['startedAt'].isoformat(),
            "completed_at": job['completedAt'].isoformat() if job.get('completedAt') else None,
            "duration_seconds": duration
        }
    
    async def list_jobs(
        self,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List recent jobs"""
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = 'SELECT * FROM "ETLJob"'
                params = []
                
                if status:
                    query += ' WHERE status = %s'
                    params.append(status)
                
                query += ' ORDER BY "createdAt" DESC LIMIT %s'
                params.append(limit)
                
                cur.execute(query, params)
                results = cur.fetchall()
                
                jobs = []
                for row in results:
                    job = dict(row)
                    job['startedAt'] = job['startedAt'].isoformat()
                    if job.get('completedAt'):
                        job['completedAt'] = job['completedAt'].isoformat()
                    if job.get('createdAt'):
                        job['createdAt'] = job['createdAt'].isoformat()
                    jobs.append(job)
                
                return jobs
                
        finally:
            if 'conn' in locals():
                conn.close()
