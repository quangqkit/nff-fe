from fastapi import APIRouter, HTTPException, Query, Path, BackgroundTasks
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from services.indicator_metadata_service import IndicatorMetadataService
from services.excel_import_service import ExcelImportService
from core.monitoring import monitor, ErrorCategory
from utils.logger import get_logger

router = APIRouter()

class IndicatorMetadataResponse(BaseModel):
    id: int
    moduleEN: str
    moduleHE: Optional[str]
    indicatorEN: str
    indicatorHE: Optional[str]
    categoryId: int
    categoryName: str
    source: str
    seriesIDs: Optional[str]
    apiExample: Optional[str]
    calculation: Optional[str]
    notes: Optional[str]
    importance: int
    relevantReports: List[str]
    defaultChartType: str
    etlStatus: str
    etlStatusCode: Optional[str]
    etlNotes: Optional[str]
    lastEtlRunAt: Optional[str]
    lastSuccessfulAt: Optional[str]
    recordsCount: int
    isActive: bool
    createdAt: str
    updatedAt: str

class IndicatorImportRequest(BaseModel):
    excelPath: str
    sheetName: str = "macro"
    categoryName: str = "Macro"

class IndicatorUpdateRequest(BaseModel):
    importance: Optional[int] = None
    relevantReports: Optional[List[str]] = None
    defaultChartType: Optional[str] = None
    isActive: Optional[bool] = None
    notes: Optional[str] = None

@router.get("/indicators", response_model=List[IndicatorMetadataResponse])
async def get_indicators(
    category: Optional[str] = Query(None, description="Filter by category name"),
    source: Optional[str] = Query(None, description="Filter by data source"),
    etl_status: Optional[str] = Query(None, description="Filter by ETL status"),
    importance_min: Optional[int] = Query(None, description="Minimum importance level"),
    is_active: Optional[bool] = Query(True, description="Filter active indicators"),
    limit: int = Query(100, description="Maximum number of results"),
    offset: int = Query(0, description="Number of results to skip")
):
    try:
        service = IndicatorMetadataService()
        
        filters = {}
        if category:
            filters["category"] = category
        if source:
            filters["source"] = source
        if etl_status:
            filters["etl_status"] = etl_status
        if importance_min is not None:
            filters["importance_min"] = importance_min
        if is_active is not None:
            filters["is_active"] = is_active
            
        indicators = await service.get_indicators(
            filters=filters,
            limit=limit,
            offset=offset
        )
        
        return indicators
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch indicators: {str(e)}"
        )

@router.get("/indicators/{indicator_id}", response_model=IndicatorMetadataResponse)
async def get_indicator(
    indicator_id: int = Path(..., description="Indicator ID")
):
    try:
        service = IndicatorMetadataService()
        indicator = await service.get_indicator_by_id(indicator_id)
        
        if not indicator:
            raise HTTPException(
                status_code=404,
                detail=f"Indicator with ID {indicator_id} not found"
            )
            
        return indicator
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch indicator: {str(e)}"
        )

@router.post("/indicators/import")
async def import_indicators_from_excel(
    request: IndicatorImportRequest,
    background_tasks: BackgroundTasks
):
    try:
        logger = get_logger(__name__)
        service = ExcelImportService()
        
        job_id = monitor.create_job(
            indicator_id=f"excel_import_{request.categoryName}",
            indicator_name=f"Excel Import: {request.sheetName} -> {request.categoryName}",
            module="System",
            source="Excel",
            series_ids=request.excelPath,
            calculation="N/A"
        )
        monitor.start_job(job_id)
        
        background_tasks.add_task(
            _import_indicators_background_task,
            service,
            request.excelPath,
            request.sheetName,
            request.categoryName,
            job_id
        )
        
        logger.info(f"Excel import job started: {job_id} for {request.sheetName} -> {request.categoryName}")
        
        return {
            "status": "success",
            "message": f"Excel import started in background for {request.sheetName} -> {request.categoryName}",
            "job_id": job_id,
            "excel_path": request.excelPath,
            "sheet_name": request.sheetName,
            "category_name": request.categoryName
        }
        
    except Exception as e:
        logger = get_logger(__name__)
        logger.error(f"Failed to start Excel import: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to import indicators: {str(e)}"
        )

async def _import_indicators_background_task(
    service: ExcelImportService,
    excel_path_or_url: str,
    sheet_name: str,
    category_name: str,
    job_id: str
):
    import os
    logger = get_logger(__name__)
    excel_path = None
    
    try:
        excel_path = await service.get_excel_file_path(excel_path_or_url)
        
        result = await service.import_indicators_from_excel(
            excel_path=excel_path,
            sheet_name=sheet_name,
            category_name=category_name,
            job_id=job_id
        )
        
        logger.info(f"Excel import completed for job {job_id}: {result}")
        
    except Exception as e:
        logger.error(f"Excel import failed for job {job_id}: {str(e)}")
        monitor.fail_job(job_id, "EXCEL_IMPORT_FAILED", str(e), ErrorCategory.SYSTEM_ERROR)
    finally:
        if excel_path and excel_path != excel_path_or_url:
            try:
                os.remove(excel_path)
                logger.info(f"Cleaned up temporary file: {excel_path}")
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup temporary file {excel_path}: {cleanup_error}")

@router.put("/indicators/{indicator_id}")
async def update_indicator(
    indicator_id: int = Path(..., description="Indicator ID"),
    request: IndicatorUpdateRequest = None
):
    try:
        service = IndicatorMetadataService()
        
        update_data = request.dict(exclude_unset=True)
        updated_indicator = await service.update_indicator(indicator_id, update_data)
        
        return {
            "status": "success",
            "message": f"Indicator {indicator_id} updated successfully",
            "data": updated_indicator
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update indicator: {str(e)}"
        )

@router.get("/indicators/{indicator_id}/etl-logs")
async def get_indicator_etl_logs(
    indicator_id: int = Path(..., description="Indicator ID"),
    limit: int = Query(10, description="Maximum number of logs")
):
    try:
        service = IndicatorMetadataService()
        logs = await service.get_etl_logs(indicator_id, limit)
        
        return {
            "status": "success",
            "indicator_id": indicator_id,
            "logs": logs
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch ETL logs: {str(e)}"
        )

@router.get("/indicators/by-report/{report_type_name}")
async def get_indicators_by_report_type(
    report_type_name: str = Path(..., description="Report type name"),
    include_default_only: bool = Query(True, description="Include only default indicators")
):
    try:
        service = IndicatorMetadataService()
        
        indicators = await service.get_indicators_for_report_type(
            report_type_name=report_type_name,
            default_only=include_default_only
        )
        
        return {
            "status": "success",
            "report_type": report_type_name,
            "indicators": indicators,
            "count": len(indicators)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch indicators for report type: {str(e)}"
        )

@router.get("/indicators/stats")
async def get_indicators_stats():
    try:
        service = IndicatorMetadataService()
        stats = await service.get_statistics()
        
        return {
            "status": "success",
            "statistics": stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch statistics: {str(e)}"
        )
