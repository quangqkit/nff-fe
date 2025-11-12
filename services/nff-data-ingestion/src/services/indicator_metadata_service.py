import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Optional, Dict, Any
from datetime import datetime
from config import settings
import logging
from core.db_pool import db_pool

logger = logging.getLogger(__name__)

class IndicatorMetadataService:
    
    def __init__(self):
        self.db_url = settings.DATABASE_URL
        self.db_pool = db_pool
    
    async def get_indicators(
        self,
        filters: Dict[str, Any] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        im.id,
                        im."moduleEN",
                        im."moduleHE",
                        im."indicatorEN",
                        im."indicatorHE",
                        im."categoryId",
                        cc.name as "categoryName",
                        im.source,
                        im."seriesIDs",
                        im."apiExample",
                        im.calculation,
                        im.notes,
                        im.importance,
                        im."relevantReports",
                        im."defaultChartType",
                        im."etlStatus",
                        im."etlStatusCode",
                        im."etlNotes",
                        im."lastEtlRunAt",
                        im."lastSuccessfulAt",
                        im."recordsCount",
                        im."isActive",
                        im."createdAt",
                        im."updatedAt"
                    FROM "IndicatorMetadata" im
                    LEFT JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                    WHERE 1=1
                """
                
                params = []
                param_count = 0
                
                if filters:
                    if filters.get("category"):
                        query += " AND cc.name = %s"
                        params.append(filters["category"])
                    
                    if filters.get("source"):
                        query += " AND im.source = %s"
                        params.append(filters["source"])
                    
                    if filters.get("etl_status"):
                        query += " AND im.\"etlStatus\" = %s"
                        params.append(filters["etl_status"])
                    
                    if filters.get("importance_min"):
                        query += " AND im.importance >= %s"
                        params.append(filters["importance_min"])
                    
                    if filters.get("is_active") is not None:
                        query += " AND im.\"isActive\" = %s"
                        params.append(filters["is_active"])
                
                query += " ORDER BY im.importance DESC, im.\"indicatorEN\" ASC"
                query += " LIMIT %s OFFSET %s"
                params.extend([limit, offset])
                
                cur.execute(query, params)
                results = cur.fetchall()
                
                indicators = [dict(row) for row in results]
                
                for indicator in indicators:
                    for field in ["lastEtlRunAt", "lastSuccessfulAt", "createdAt", "updatedAt"]:
                        if indicator[field]:
                            indicator[field] = indicator[field].isoformat()
                
                return indicators
                
        except Exception as e:
            logger.error(f"Error fetching indicators: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_indicator_by_id(self, indicator_id: int) -> Optional[Dict[str, Any]]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        im.id,
                        im."moduleEN",
                        im."moduleHE",
                        im."indicatorEN",
                        im."indicatorHE",
                        im."categoryId",
                        cc.name as "categoryName",
                        im.source,
                        im."seriesIDs",
                        im."apiExample",
                        im.calculation,
                        im.notes,
                        im.importance,
                        im."relevantReports",
                        im."defaultChartType",
                        im."etlStatus",
                        im."etlStatusCode",
                        im."etlNotes",
                        im."lastEtlRunAt",
                        im."lastSuccessfulAt",
                        im."recordsCount",
                        im."isActive",
                        im."createdAt",
                        im."updatedAt"
                    FROM "IndicatorMetadata" im
                    LEFT JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                    WHERE im.id = %s
                """
                
                cur.execute(query, (indicator_id,))
                result = cur.fetchone()
                
                if result:
                    indicator = dict(result)
                    for field in ["lastEtlRunAt", "lastSuccessfulAt", "createdAt", "updatedAt"]:
                        if indicator[field]:
                            indicator[field] = indicator[field].isoformat()
                    return indicator
                
                return None
                
        except Exception as e:
            logger.error(f"Error fetching indicator {indicator_id}: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def update_indicator(
        self,
        indicator_id: int,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                set_clauses = []
                params = []
                param_count = 0
                
                for key, value in update_data.items():
                    set_clauses.append(f'"{key}" = %s')
                    params.append(value)
                
                if not set_clauses:
                    raise ValueError("No fields to update")
                
                set_clauses.append(f'"updatedAt" = %s')
                params.append(datetime.now())
                
                query = f"""
                    UPDATE "IndicatorMetadata" 
                    SET {', '.join(set_clauses)}
                    WHERE id = %s
                    RETURNING *
                """
                params.append(indicator_id)
                
                cur.execute(query, params)
                result = cur.fetchone()
                
                if not result:
                    raise ValueError(f"Indicator {indicator_id} not found")
                
                conn.commit()
                
                return await self.get_indicator_by_id(indicator_id)
                
        except Exception as e:
            logger.error(f"Error updating indicator {indicator_id}: {e}")
            if 'conn' in locals():
                conn.rollback()
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_etl_logs(
        self,
        indicator_id: int,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        "jobId",
                        status,
                        "errorCode",
                        "errorMessage",
                        "errorCategory",
                        "recordsProcessed",
                        "recordsInserted",
                        "recordsUpdated",
                        "startedAt",
                        "completedAt",
                        "createdAt",
                        metadata
                    FROM "IndicatorETLLog"
                    WHERE "indicatorId" = %s
                    ORDER BY "createdAt" DESC
                    LIMIT %s
                """
                
                cur.execute(query, (indicator_id, limit))
                results = cur.fetchall()
                
                logs = []
                for row in results:
                    log = dict(row)
                    for field in ["startedAt", "completedAt", "createdAt"]:
                        if log[field]:
                            log[field] = log[field].isoformat()
                    logs.append(log)
                
                return logs
                
        except Exception as e:
            logger.error(f"Error fetching ETL logs for indicator {indicator_id}: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_indicators_for_report_type(
        self,
        report_type_name: str,
        default_only: bool = True
    ) -> List[Dict[str, Any]]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                query = """
                    SELECT 
                        im.id,
                        im."indicatorEN",
                        im."moduleEN",
                        im.source,
                        im."seriesIDs",
                        im.calculation,
                        im.importance,
                        im."defaultChartType",
                        im."etlStatus",
                        im."lastSuccessfulAt",
                        im."recordsCount",
                        ird."isDefault"
                    FROM "IndicatorMetadata" im
                    INNER JOIN "IndicatorReportDefault" ird ON ird."indicatorId" = im.id
                    INNER JOIN "ReportType" rt ON rt.id = ird."reportTypeId"
                    WHERE rt.name = %s
                    AND im."isActive" = true
                    AND im."etlStatus" = 'OK'
                """
                
                params = [report_type_name]
                
                if default_only:
                    query += " AND ird.\"isDefault\" = true"
                
                query += " ORDER BY im.importance DESC, im.\"indicatorEN\" ASC"
                
                cur.execute(query, params)
                results = cur.fetchall()
                
                indicators = []
                for row in results:
                    indicator = dict(row)
                    if indicator["lastSuccessfulAt"]:
                        indicator["lastSuccessfulAt"] = indicator["lastSuccessfulAt"].isoformat()
                    indicators.append(indicator)
                
                return indicators
                
        except Exception as e:
            logger.error(f"Error fetching indicators for report type {report_type_name}: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_statistics(self) -> Dict[str, Any]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN "isActive" = true THEN 1 END) as active,
                        COUNT(CASE WHEN "etlStatus" = 'OK' THEN 1 END) as etl_success,
                        COUNT(CASE WHEN "etlStatus" = 'ERROR' THEN 1 END) as etl_error,
                        COUNT(CASE WHEN "etlStatus" = 'UNKNOWN' THEN 1 END) as etl_unknown,
                        COUNT(CASE WHEN importance = 5 THEN 1 END) as high_importance
                    FROM "IndicatorMetadata"
                """)
                total_stats = cur.fetchone()
                
                cur.execute("""
                    SELECT 
                        cc.name as category,
                        COUNT(*) as count,
                        COUNT(CASE WHEN im."etlStatus" = 'OK' THEN 1 END) as success_count
                    FROM "IndicatorMetadata" im
                    LEFT JOIN "ChartCategory" cc ON cc.id = im."categoryId"
                    WHERE im."isActive" = true
                    GROUP BY cc.name
                    ORDER BY count DESC
                """)
                category_stats = cur.fetchall()
                
                cur.execute("""
                    SELECT 
                        source,
                        COUNT(*) as count,
                        COUNT(CASE WHEN "etlStatus" = 'OK' THEN 1 END) as success_count
                    FROM "IndicatorMetadata"
                    WHERE "isActive" = true
                    GROUP BY source
                    ORDER BY count DESC
                """)
                source_stats = cur.fetchall()
                
                return {
                    "total": dict(total_stats),
                    "by_category": [dict(row) for row in category_stats],
                    "by_source": [dict(row) for row in source_stats]
                }
                
        except Exception as e:
            logger.error(f"Error fetching statistics: {e}")
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_or_create_category(self, category_name: str) -> Optional[Any]:
        try:
            with self.db_pool.get_cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM "ChartCategory" WHERE name = %s
                """, (category_name,))
                category = cur.fetchone()
                
                if category:
                    class Category:
                        def __init__(self, data):
                            self.id = data['id']
                            self.name = data['name']
                            self.description = data['description']
                            self.icon = data['icon']
                            self.isActive = data['isActive']
                    
                    return Category(dict(category))
                
                cur.execute("""
                    INSERT INTO "ChartCategory" (name, description, icon, "isActive", "createdAt")
                    VALUES (%s, %s, %s, true, NOW())
                    RETURNING *
                """, (category_name, f"{category_name} indicators", "chart"))
                
                new_category = cur.fetchone()
                
                class Category:
                    def __init__(self, data):
                        self.id = data['id']
                        self.name = data['name']
                        self.description = data['description']
                        self.icon = data['icon']
                        self.isActive = data['isActive']
                
                return Category(dict(new_category))
                
        except Exception as e:
            logger.error(f"Error getting or creating category {category_name}: {e}")
            raise
    
    async def upsert_indicator_metadata(self, indicator_data: Dict[str, Any]) -> Any:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT id FROM "IndicatorMetadata" 
                    WHERE "indicatorEN" = %s AND "categoryId" = %s
                """, (indicator_data['indicatorEN'], indicator_data['categoryId']))
                
                existing = cur.fetchone()
                
                if existing:
                    indicator_id = existing['id']
                    cur.execute("""
                        UPDATE "IndicatorMetadata" SET
                            "moduleEN" = %s,
                            "moduleHE" = %s,
                            "indicatorHE" = %s,
                            source = %s,
                            "seriesIDs" = %s,
                            "apiExample" = %s,
                            calculation = %s,
                            notes = %s,
                            importance = %s,
                            "relevantReports" = %s,
                            "etlStatus" = %s,
                            "etlNotes" = %s,
                            "isActive" = %s,
                            "updatedAt" = NOW()
                        WHERE id = %s
                        RETURNING *
                    """, (
                        indicator_data['moduleEN'],
                        indicator_data.get('moduleHE'),
                        indicator_data.get('indicatorHE'),
                        indicator_data['source'],
                        indicator_data.get('seriesIDs'),
                        indicator_data.get('apiExample'),
                        indicator_data.get('calculation'),
                        indicator_data.get('notes'),
                        indicator_data['importance'],
                        indicator_data.get('relevantReports', []),
                        indicator_data['etlStatus'],
                        indicator_data.get('etlNotes'),
                        indicator_data['isActive'],
                        indicator_id
                    ))
                else:
                    cur.execute("""
                        INSERT INTO "IndicatorMetadata" (
                            "moduleEN", "moduleHE", "indicatorEN", "indicatorHE",
                            "categoryId", source, "seriesIDs", "apiExample",
                            calculation, notes, importance, "relevantReports",
                            "etlStatus", "etlNotes", "isActive", "createdAt", "updatedAt"
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                        ) RETURNING *
                    """, (
                        indicator_data['moduleEN'],
                        indicator_data.get('moduleHE'),
                        indicator_data['indicatorEN'],
                        indicator_data.get('indicatorHE'),
                        indicator_data['categoryId'],
                        indicator_data['source'],
                        indicator_data.get('seriesIDs'),
                        indicator_data.get('apiExample'),
                        indicator_data.get('calculation'),
                        indicator_data.get('notes'),
                        indicator_data['importance'],
                        indicator_data.get('relevantReports', []),
                        indicator_data['etlStatus'],
                        indicator_data.get('etlNotes'),
                        indicator_data['isActive']
                    ))
                
                result = cur.fetchone()
                conn.commit()
                            
                class Indicator:
                    def __init__(self, data):
                        for key, value in data.items():
                            setattr(self, key, value)
                
                return Indicator(dict(result))
                
        except Exception as e:
            logger.error(f"Error upserting indicator {indicator_data.get('indicatorEN')}: {e}")
            if 'conn' in locals():
                conn.rollback()
            raise
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def get_report_type_by_name(self, report_name: str) -> Optional[Any]:
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT * FROM "ReportType" WHERE name = %s
                """, (report_name,))
                
                result = cur.fetchone()
                
                if result:
                    class ReportType:
                        def __init__(self, data):
                            self.id = data['id']
                            self.name = data['name']
                    
                    return ReportType(dict(result))
                
                return None
                
        except Exception as e:
            logger.error(f"Error getting report type {report_name}: {e}")
            return None
        finally:
            if 'conn' in locals():
                conn.close()
    
    async def create_indicator_report_default(self, mapping_data: Dict[str, Any]) -> None:      
        try:
            conn = psycopg2.connect(self.db_url)
            
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM "IndicatorReportDefault" 
                    WHERE "indicatorId" = %s AND "reportTypeId" = %s
                """, (mapping_data['indicatorId'], mapping_data['reportTypeId']))
                
                existing = cur.fetchone()
                
                if not existing:
                    cur.execute("""
                        INSERT INTO "IndicatorReportDefault" (
                            "indicatorId", "reportTypeId", "isDefault", "createdAt", "updatedAt"
                        ) VALUES (%s, %s, %s, NOW(), NOW())
                    """, (
                        mapping_data['indicatorId'],
                        mapping_data['reportTypeId'],
                        mapping_data['isDefault']
                    ))
                    conn.commit()
                
        except Exception as e:
            logger.error(f"Error creating indicator report default: {e}")
            if 'conn' in locals():
                conn.rollback()
        finally:
            if 'conn' in locals():
                conn.close()