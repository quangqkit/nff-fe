from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import Optional, List, Dict, Any
from datetime import date
from services.excel_import_service import ExcelImportService
from services.etl_service import ETLService
from core.monitoring import monitor
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

excel_import_service = ExcelImportService()
etl_service = ETLService()

CATEGORY_SHEET_MAP = {
    "Macro": "Macro",
    "Micro": "Micro",
    "Options": "Options",
    "CTA": "CTA",
    "Combination": "Combination",
    "Exclusive": "Exclusive"
}

@router.post("/bulk/import-all-categories", summary="Import all categories from Excel file")
async def import_all_categories_from_excel_api(
    excel_path: str = Query(..., description="Path to the Excel file"),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    try:
        job_id = monitor.create_job(
            indicator_id="bulk_import_all",
            indicator_name="Bulk Import All Categories",
            module="System",
            source="Excel",
            series_ids=excel_path,
            calculation="N/A"
        )
        monitor.start_job(job_id)

        background_tasks.add_task(
            excel_import_service.import_all_categories_from_excel,
            excel_path,
            job_id
        )

        return {
            "success": True,
            "message": "Bulk import of all categories started in background",
            "job_id": job_id,
            "excel_path": excel_path,
            "expected_categories": ["Macro", "Micro", "Options", "CTA", "Combination", "Exclusive"]
        }
    except Exception as e:
        logger.error(f"Failed to start bulk import: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start bulk import: {str(e)}")

@router.post("/bulk/fetch-all-categories", summary="Perform full historical fetch for all categories")
async def fetch_all_categories_full(
    background_tasks: BackgroundTasks,
    start_date: Optional[date] = Query(None, description="Start date for historical data (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for historical data (YYYY-MM-DD)"),
    importance_min: Optional[int] = Query(None, ge=1, le=5, description="Minimum importance level to process")
):
    try:
        categories = ["Macro", "Micro", "Options", "CTA", "Combination", "Exclusive"]
        
        job_id = monitor.create_job(
            indicator_id="bulk_fetch_all",
            indicator_name="Bulk Full Fetch All Categories",
            module="System",
            source="Multiple",
            series_ids="",
            calculation="N/A"
        )
        monitor.start_job(job_id)

        background_tasks.add_task(
            _bulk_full_fetch_task,
            categories,
            start_date,
            end_date,
            importance_min,
            job_id
        )

        return {
            "success": True,
            "message": f"Bulk full fetch started for {len(categories)} categories",
            "job_id": job_id,
            "categories": categories,
            "metadata": {
                "start_date": str(start_date),
                "end_date": str(end_date),
                "importance_min": importance_min
            }
        }
    except Exception as e:
        logger.error(f"Failed to start bulk full fetch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start bulk full fetch: {str(e)}")

@router.post("/bulk/incremental-fetch-all", summary="Perform incremental fetch for all categories")
async def fetch_all_categories_incremental(
    background_tasks: BackgroundTasks,
    days_back: int = Query(30, ge=1, description="Number of days back from today to fetch data incrementally"),
    importance_min: Optional[int] = Query(None, ge=1, le=5, description="Minimum importance level to process")
):
    """
    Triggers an incremental fetch for all categories.
    Ideal for daily/weekly sync operations.
    """
    try:
        categories = ["Macro", "Micro", "Options", "CTA", "Combination", "Exclusive"]
        
        job_id = monitor.create_job(
            indicator_id="bulk_incremental_all",
            indicator_name="Bulk Incremental Fetch All Categories",
            module="System",
            source="Multiple",
            series_ids="",
            calculation="N/A"
        )
        monitor.start_job(job_id)

        background_tasks.add_task(
            _bulk_incremental_fetch_task,
            categories,
            days_back,
            importance_min,
            job_id
        )

        return {
            "success": True,
            "message": f"Bulk incremental fetch started for {len(categories)} categories",
            "job_id": job_id,
            "categories": categories,
            "metadata": {
                "days_back": days_back,
                "importance_min": importance_min
            }
        }
    except Exception as e:
        logger.error(f"Failed to start bulk incremental fetch: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start bulk incremental fetch: {str(e)}")

@router.get("/bulk/status/{job_id}", summary="Get status of bulk operation")
async def get_bulk_operation_status(job_id: str):
    try:
        job_status = monitor.get_job_status(job_id)
        if not job_status:
            raise HTTPException(status_code=404, detail=f"Bulk operation with ID '{job_id}' not found")
        
        return {
            "success": True,
            "job_id": job_id,
            "status": job_status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get bulk operation status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get bulk operation status: {str(e)}")

async def _bulk_full_fetch_task(
    categories: List[str],
    start_date: Optional[date],
    end_date: Optional[date],
    importance_min: Optional[int],
    parent_job_id: str
):
    """
    Background task to perform full fetch for all categories
    """
    successful_categories = []
    failed_categories = []
    
    for category in categories:
        try:
            logger.info(f"Starting full fetch for category: {category}")
            
            await etl_service.trigger_full_historical_fetch(
                category, start_date, end_date, importance_min, None
            )
            
            successful_categories.append(category)
            logger.info(f"Successfully triggered full fetch for category: {category}")
            
        except Exception as e:
            failed_categories.append({"category": category, "error": str(e)})
            logger.error(f"Failed to trigger full fetch for category {category}: {e}")
    
    monitor.update_job_metadata(parent_job_id, {
        "successful_categories": successful_categories,
        "failed_categories": failed_categories,
        "total_categories": len(categories)
    })
    
    if failed_categories:
        monitor.complete_job(parent_job_id, records_count=len(successful_categories), 
                           metadata={"partial_success": True})
    else:
        monitor.complete_job(parent_job_id, records_count=len(successful_categories))

async def _bulk_incremental_fetch_task(
    categories: List[str],
    days_back: int,
    importance_min: Optional[int],
    parent_job_id: str
):
    successful_categories = []
    failed_categories = []
    
    for category in categories:
        try:
            logger.info(f"Starting incremental fetch for category: {category}")
            
            await etl_service.trigger_incremental_fetch(
                category, days_back, importance_min, None
            )
            
            successful_categories.append(category)
            logger.info(f"Successfully triggered incremental fetch for category: {category}")
            
        except Exception as e:
            failed_categories.append({"category": category, "error": str(e)})
            logger.error(f"Failed to trigger incremental fetch for category {category}: {e}")
    
    monitor.update_job_metadata(parent_job_id, {
        "successful_categories": successful_categories,
        "failed_categories": failed_categories,
        "total_categories": len(categories)
    })
    
    if failed_categories:
        monitor.complete_job(parent_job_id, records_count=len(successful_categories), 
                           metadata={"partial_success": True})
    else:
        monitor.complete_job(parent_job_id, records_count=len(successful_categories))
