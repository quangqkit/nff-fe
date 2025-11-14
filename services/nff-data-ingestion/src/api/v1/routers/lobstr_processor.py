import asyncio
from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
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
    processed_count: int
    duplicates_skipped: int
    schedule_id: str
    run_id: str


@router.post("/lobstr/jobs", response_model=LobstrProcessResponse)
async def process_lobstr_run(request: LobstrProcessRequest):
    try:
        service = LobstrProcessorService()
        result = await service.process_download(
            download_url=request.download_url,
            schedule_id=request.schedule_id,
            run_id=request.run_id,
        )
        return LobstrProcessResponse(
            processed_count=result["processed_count"],
            duplicates_skipped=result["duplicates_skipped"],
            schedule_id=request.schedule_id,
            run_id=request.run_id,
        )
    except Exception as exc:
        logger.error(f"Failed to process Lobstr run {request.run_id}: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process Lobstr run {request.run_id}: {str(exc)}",
        )


@router.get("/lobstr/health")
async def lobstr_health_check():
    return {
        "status": "ok",
        "service": "lobstr-processor",
        "message": "Lobstr processor is ready",
    }
