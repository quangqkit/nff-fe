"""
Core Monitoring and Logging System for Indicators
Manages indicator status, errors, last fetch time, and processing states
"""

import json
import sqlite3
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging

class IndicatorStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"

class ErrorCategory(Enum):
    CONFIG_ERROR = "config_error"
    API_ERROR = "api_error"
    DATA_ERROR = "data_error"
    CALCULATION_ERROR = "calculation_error"
    NETWORK_ERROR = "network_error"
    TIMEOUT_ERROR = "timeout_error"

@dataclass
class IndicatorJob:
    """Represents a single indicator processing job"""
    job_id: str
    indicator_id: str
    indicator_name: str
    module: str
    source: str
    series_ids: str
    calculation: Optional[str] = None
    status: IndicatorStatus = IndicatorStatus.PENDING
    created_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    records_count: int = 0
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    error_category: Optional[ErrorCategory] = None
    last_fetch_at: Optional[datetime] = None
    metadata: Dict[str, Any] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.metadata is None:
            self.metadata = {}

class IndicatorMonitor:
    """Core monitoring system for indicator processing"""
    
    def __init__(self, db_path: str = "indicator_monitor.db"):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        self._init_database()
    
    def _init_database(self):
        """Initialize SQLite database for monitoring"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS indicator_jobs (
                job_id TEXT PRIMARY KEY,
                indicator_id TEXT NOT NULL,
                indicator_name TEXT NOT NULL,
                module TEXT,
                source TEXT,
                series_ids TEXT,
                calculation TEXT,
                status TEXT NOT NULL,
                created_at TIMESTAMP NOT NULL,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                records_count INTEGER DEFAULT 0,
                error_code TEXT,
                error_message TEXT,
                error_category TEXT,
                last_fetch_at TIMESTAMP,
                metadata TEXT,
                UNIQUE(indicator_id, created_at)
            )
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_indicator_id ON indicator_jobs(indicator_id)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_status ON indicator_jobs(status)
        ''')
        
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_created_at ON indicator_jobs(created_at)
        ''')
        
        conn.commit()
        conn.close()
    
    def create_job(self, indicator_id: str, indicator_name: str, module: str, 
                   source: str, series_ids: str, calculation: Optional[str] = None) -> str:
        """Create a new indicator processing job"""
        job_id = f"JOB_{indicator_id}_{int(datetime.now().timestamp())}"
        
        job = IndicatorJob(
            job_id=job_id,
            indicator_id=indicator_id,
            indicator_name=indicator_name,
            module=module,
            source=source,
            series_ids=series_ids,
            calculation=calculation
        )
        
        self._save_job(job)
        self.logger.info(f"Created job {job_id} for indicator {indicator_name}")
        return job_id
    
    def start_job(self, job_id: str) -> bool:
        """Mark job as started/processing"""
        job = self._get_job(job_id)
        if not job:
            return False
        
        job.status = IndicatorStatus.PROCESSING
        job.started_at = datetime.now(timezone.utc)
        
        self._save_job(job)
        self.logger.info(f"Started job {job_id}")
        return True
    
    def complete_job(self, job_id: str, records_count: int = 0, 
                    last_fetch_at: Optional[datetime] = None) -> bool:
        """Mark job as completed successfully"""
        job = self._get_job(job_id)
        if not job:
            return False
        
        job.status = IndicatorStatus.SUCCESS
        job.completed_at = datetime.now(timezone.utc)
        job.records_count = records_count
        if last_fetch_at:
            job.last_fetch_at = last_fetch_at
        
        self._save_job(job)
        self.logger.info(f"Completed job {job_id} with {records_count} records")
        return True
    
    def fail_job(self, job_id: str, error_code: str, error_message: str, 
                error_category: ErrorCategory, metadata: Optional[Dict] = None) -> bool:
        """Mark job as failed with error details"""
        job = self._get_job(job_id)
        if not job:
            return False
        
        job.status = IndicatorStatus.FAILED
        job.completed_at = datetime.now(timezone.utc)
        job.error_code = error_code
        job.error_message = error_message
        job.error_category = error_category
        if metadata:
            job.metadata.update(metadata)
        
        self._save_job(job)
        self.logger.error(f"Failed job {job_id}: {error_code} - {error_message}")
        return True
    
    def get_job_status(self, job_id: str) -> Optional[Dict]:
        """Get current status of a job"""
        job = self._get_job(job_id)
        if not job:
            return None
        
        return {
            'job_id': job.job_id,
            'indicator_name': job.indicator_name,
            'status': job.status.value,
            'created_at': job.created_at.isoformat(),
            'started_at': job.started_at.isoformat() if job.started_at else None,
            'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            'records_count': job.records_count,
            'error_code': job.error_code,
            'error_message': job.error_message,
            'last_fetch_at': job.last_fetch_at.isoformat() if job.last_fetch_at else None,
            'progress': self._calculate_progress(job)
        }
    
    def get_indicators_summary(self) -> Dict[str, Any]:
        """Get summary of all indicators processing"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get counts by status
        cursor.execute('''
            SELECT status, COUNT(*) 
            FROM indicator_jobs 
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY status
        ''')
        status_counts = dict(cursor.fetchall())
        
        # Get recent jobs
        cursor.execute('''
            SELECT job_id, indicator_name, status, created_at, records_count, error_code
            FROM indicator_jobs 
            WHERE created_at >= datetime('now', '-24 hours')
            ORDER BY created_at DESC
            LIMIT 50
        ''')
        recent_jobs = [
            {
                'job_id': row[0],
                'indicator_name': row[1],
                'status': row[2],
                'created_at': row[3],
                'records_count': row[4],
                'error_code': row[5]
            }
            for row in cursor.fetchall()
        ]
        
        # Get error breakdown
        cursor.execute('''
            SELECT error_code, COUNT(*) 
            FROM indicator_jobs 
            WHERE status = 'failed' AND created_at >= datetime('now', '-7 days')
            GROUP BY error_code
            ORDER BY COUNT(*) DESC
        ''')
        error_breakdown = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            'total_jobs_last_7_days': sum(status_counts.values()),
            'status_breakdown': status_counts,
            'recent_jobs': recent_jobs,
            'error_breakdown': error_breakdown,
            'success_rate': self._calculate_success_rate(status_counts)
        }
    
    def _save_job(self, job: IndicatorJob):
        """Save job to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO indicator_jobs 
            (job_id, indicator_id, indicator_name, module, source, series_ids, 
             calculation, status, created_at, started_at, completed_at, 
             records_count, error_code, error_message, error_category, 
             last_fetch_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            job.job_id, job.indicator_id, job.indicator_name, job.module,
            job.source, job.series_ids, job.calculation, job.status.value,
            job.created_at, job.started_at, job.completed_at, job.records_count,
            job.error_code, job.error_message, 
            job.error_category.value if job.error_category else None,
            job.last_fetch_at, json.dumps(job.metadata)
        ))
        
        conn.commit()
        conn.close()
    
    def _get_job(self, job_id: str) -> Optional[IndicatorJob]:
        """Get job from database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM indicator_jobs WHERE job_id = ?
        ''', (job_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None
        
        return IndicatorJob(
            job_id=row[0],
            indicator_id=row[1],
            indicator_name=row[2],
            module=row[3],
            source=row[4],
            series_ids=row[5],
            calculation=row[6],
            status=IndicatorStatus(row[7]),
            created_at=datetime.fromisoformat(row[8].replace('Z', '+00:00')),
            started_at=datetime.fromisoformat(row[9].replace('Z', '+00:00')) if row[9] else None,
            completed_at=datetime.fromisoformat(row[10].replace('Z', '+00:00')) if row[10] else None,
            records_count=row[11],
            error_code=row[12],
            error_message=row[13],
            error_category=ErrorCategory(row[14]) if row[14] else None,
            last_fetch_at=datetime.fromisoformat(row[15].replace('Z', '+00:00')) if row[15] else None,
            metadata=json.loads(row[16]) if row[16] else {}
        )
    
    def _calculate_progress(self, job: IndicatorJob) -> str:
        """Calculate progress percentage for a job"""
        if job.status == IndicatorStatus.SUCCESS:
            return "100%"
        elif job.status == IndicatorStatus.FAILED:
            return "Failed"
        elif job.status == IndicatorStatus.PROCESSING:
            return "Processing..."
        else:
            return "Pending"
    
    def _calculate_success_rate(self, status_counts: Dict[str, int]) -> float:
        """Calculate success rate percentage"""
        total = sum(status_counts.values())
        if total == 0:
            return 0.0
        success = status_counts.get('success', 0)
        return round((success / total) * 100, 2)

# Global monitor instance
monitor = IndicatorMonitor()
