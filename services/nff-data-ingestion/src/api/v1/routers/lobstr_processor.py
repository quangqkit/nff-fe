"""
Lobstr Data Processor Router
API endpoints for processing Lobstr CSV data
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from services.lobstr_processor_service import LobstrProcessorService
from utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

class LobstrProcessRequest(BaseModel):
    download_url: str
    schedule_id: str
    run_id: str

class LobstrProcessResponse(BaseModel):
    status: str
    message: str
    processed_count: int
    duplicates_skipped: int
    run_id: str
    schedule_id: str

@router.post("/lobstr/process", response_model=LobstrProcessResponse)
async def process_lobstr_data(request: LobstrProcessRequest):
    """
    Process Lobstr CSV data and save to database
    """
    try:
        logger.info(f"Processing Lobstr data for schedule {request.schedule_id}, run {request.run_id}")
        
        service = LobstrProcessorService()
        
        result = await service.process_lobstr_csv(
            download_url=request.download_url,
            schedule_id=request.schedule_id,
            run_id=request.run_id
        )
        
        return LobstrProcessResponse(
            status="success",
            message=f"Successfully processed {result['processed_count']} tweets",
            processed_count=result['processed_count'],
            duplicates_skipped=result['duplicates_skipped'],
            run_id=request.run_id,
            schedule_id=request.schedule_id
        )
        
    except Exception as e:
        logger.error(f"Failed to process Lobstr data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process Lobstr data: {str(e)}"
        )

@router.get("/lobstr/health")
async def lobstr_health_check():
    """
    Health check for Lobstr processor
    """
    return {
        "status": "ok",
        "service": "lobstr-processor",
        "message": "Lobstr processor is ready"
    }
