from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from services.etl_service import ETLService

router = APIRouter()

class ETLJobRequest(BaseModel):
    indicator_ids: Optional[List[int]] = None
    category: Optional[str] = None
    source: Optional[str] = None
    force_refresh: bool = False

class ETLJobResponse(BaseModel):
    job_id: str
    status: str
    started_at: str
    total_indicators: int
    message: str

class ETLResult(BaseModel):
    job_id: str
    status: str
    total_indicators: int
    successful: int
    failed: int
    blocked: int
    details: List[Dict[str, Any]]
    started_at: str
    completed_at: Optional[str]
    duration_seconds: Optional[float]

@router.post("/etl/jobs", response_model=ETLJobResponse)
async def create_etl_job(
    request: ETLJobRequest,
    background_tasks: BackgroundTasks
):
    try:
        service = ETLService()
        
        if not request.indicator_ids and not request.category and not request.source:
            raise HTTPException(
                status_code=400,
                detail="Must specify indicator_ids, category, or source"
            )
        
        job = await service.create_job(
            indicator_ids=request.indicator_ids,
            category=request.category,
            source=request.source,
            force_refresh=request.force_refresh
        )
        
        background_tasks.add_task(
            service.process_job,
            job_id=job["job_id"]
        )
        
        return ETLJobResponse(
            job_id=job["job_id"],
            status=job["status"],
            started_at=job["started_at"],
            total_indicators=job["total_indicators"],
            message=job["message"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create ETL job: {str(e)}"
        )

@router.get("/etl/jobs/{job_id}")
async def get_etl_job_status(
    job_id: str = Path(..., description="ETL Job ID")
):
    try:
        from core.monitoring import monitor
        
        service = ETLService()
        result = await service.get_job_result(job_id)
        
        if result:
            return ETLResult(**result)
        
        monitor_job = monitor.get_job_status(job_id)
        if monitor_job:
            return {
                "job_id": monitor_job.get('job_id'),
                "status": monitor_job.get('status', 'unknown'),
                "indicator_name": monitor_job.get('indicator_name'),
                "created_at": monitor_job.get('created_at'),
                "started_at": monitor_job.get('started_at'),
                "completed_at": monitor_job.get('completed_at'),
                "records_count": monitor_job.get('records_count', 0),
                "error_code": monitor_job.get('error_code'),
                "error_message": monitor_job.get('error_message'),
                "progress": monitor_job.get('progress', {}),
                "total_indicators": 0,
                "successful": monitor_job.get('records_count', 0) if monitor_job.get('status') == 'completed' else 0,
                "failed": 1 if monitor_job.get('status') == 'failed' else 0,
                "blocked": 0,
                "details": [],
                "duration_seconds": None
            }
        
        raise HTTPException(
            status_code=404,
            detail=f"Job {job_id} not found in ETL service or monitoring system"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch job status: {str(e)}"
        )

@router.get("/etl/jobs")
async def list_etl_jobs(
    status: Optional[str] = Query(None, description="Filter by job status"),
    limit: int = Query(50, description="Maximum number of jobs")
):
    try:
        service = ETLService()
        jobs = await service.list_jobs(status=status, limit=limit)
        
        return {
            "status": "success",
            "jobs": jobs,
            "count": len(jobs)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch jobs: {str(e)}"
        )

@router.post("/etl/indicators/{indicator_id}/fetch")
async def fetch_single_indicator(
    indicator_id: int = Path(..., description="Indicator ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    force_refresh: bool = Query(False, description="Force refresh data")
):
    try:
        service = ETLService()
        
        start_dt = None
        end_dt = None
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        result = await service.fetch_indicator_data(
            indicator_id=indicator_id,
            start_date=start_dt,
            end_date=end_dt,
            force_refresh=force_refresh
        )
        
        return {
            "status": "success",
            "indicator_id": indicator_id,
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch indicator data: {str(e)}"
        )

@router.post("/etl/category/{category_name}/fetch-all")
async def fetch_category_indicators(
    category_name: str = Path(..., description="Category name (Macro, Micro, etc.)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    importance_min: int = Query(1, description="Minimum importance level"),
    background_tasks: BackgroundTasks = None
):
    try:
        service = ETLService()
        
        start_dt = None
        end_dt = None
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        job = await service.create_category_job(
            category_name=category_name,
            start_date=start_dt,
            end_date=end_dt,
            importance_min=importance_min
        )
        
        background_tasks.add_task(
            service.process_category_job,
            job_id=job["job_id"]
        )
        
        return {
            "status": "success",
            "job_id": job["job_id"],
            "message": f"Started fetching {category_name} indicators",
            "estimated_indicators": job["total_indicators"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start category fetch: {str(e)}"
        )

@router.post("/etl/incremental/{category_name}")
async def incremental_fetch_category(
    category_name: str = Path(..., description="Category name"),
    days_back: int = Query(30, description="Number of days back to fetch"),
    background_tasks: BackgroundTasks = None
):
    try:
        service = ETLService()
        
        job = await service.create_incremental_job(
            category_name=category_name,
            days_back=days_back
        )
        
        background_tasks.add_task(
            service.process_incremental_job,
            job_id=job["job_id"]
        )
        
        return {
            "status": "success",
            "job_id": job["job_id"],
            "message": f"Started incremental fetch for {category_name}",
            "days_back": days_back,
            "estimated_indicators": job["total_indicators"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start incremental fetch: {str(e)}"
        )

@router.get("/etl/indicators/{indicator_id}/data")
async def get_indicator_data(
    indicator_id: int = Path(..., description="Indicator ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(1000, description="Maximum number of data points")
):
    try:
        service = ETLService()
        
        start_dt = None
        end_dt = None
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        data = await service.get_indicator_time_series(
            indicator_id=indicator_id,
            start_date=start_dt,
            end_date=end_dt,
            limit=limit
        )
        
        return {
            "status": "success",
            "indicator_id": indicator_id,
            "data": data,
            "count": len(data)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch indicator data: {str(e)}"
        )
