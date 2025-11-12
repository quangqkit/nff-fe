"""
Scheduler Management API Router
View and manage scheduled cron jobs
"""
from fastapi import APIRouter, HTTPException
from scheduler import tweet_processing_scheduler
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/scheduler/jobs", summary="Get all scheduled jobs")
async def get_scheduled_jobs():
    """
    Get list of all scheduled cron jobs with their next run times
    """
    try:
        jobs = tweet_processing_scheduler.get_scheduled_jobs()
        
        return {
            "success": True,
            "enabled": tweet_processing_scheduler.is_enabled,
            "total_jobs": len(jobs),
            "jobs": jobs
        }
    except Exception as e:
        logger.error(f"Failed to get scheduled jobs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheduled jobs: {str(e)}")

@router.get("/scheduler/status", summary="Get scheduler status")
async def get_scheduler_status():
    """
    Get overall scheduler status
    """
    try:
        jobs = tweet_processing_scheduler.get_scheduled_jobs()
        
        return {
            "success": True,
            "enabled": tweet_processing_scheduler.is_enabled,
            "running": tweet_processing_scheduler.scheduler.running if tweet_processing_scheduler.is_enabled else False,
            "total_jobs": len(jobs),
            "next_runs": [
                {
                    "job_name": job['name'],
                    "next_run": job['next_run']
                }
                for job in jobs[:5]  # Show next 5 jobs
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get scheduler status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get scheduler status: {str(e)}")

@router.post("/scheduler/trigger/{job_id}", summary="Manually trigger a scheduled job")
async def manually_trigger_job(job_id: str):
    """
    Manually trigger a scheduled job (for testing)
    """
    try:
        if not tweet_processing_scheduler.is_enabled:
            raise HTTPException(status_code=400, detail="Scheduler is not enabled. Set ENABLE_CRON_JOBS=true")
        
        # Get job
        job = tweet_processing_scheduler.scheduler.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found")
        
        # Trigger job manually
        logger.info(f"Manually triggering job: {job_id}")
        job.modify(next_run_time=None)  # Run immediately
        
        return {
            "success": True,
            "message": f"Job '{job_id}' triggered manually",
            "job_name": job.name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger job: {str(e)}")
