from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from utils.sentry import init_sentry
from utils.logger import get_logger
import uvicorn

logger = get_logger(__name__)

from api.v1.routers import (
    indicators_router,
    etl_router,
    health_router,
    cache_router,
    bulk_operations,
)
from api.v1.routers.lobstr_processor import router as lobstr_processor_router
from api.v1.routers.tweet_enrichment import router as tweet_enrichment_router

app = FastAPI(
    title="NFF Data Ingestion Service",
    description="Enhanced data preprocessing and cleaning service for macro and micro financial data",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1", tags=["Health"])
app.include_router(cache_router, prefix="/api/v1", tags=["Cache"])
app.include_router(indicators_router, prefix="/api/v1", tags=["Indicators"])
app.include_router(etl_router, prefix="/api/v1", tags=["ETL"])
app.include_router(bulk_operations.router, prefix="/api/v1", tags=["Bulk Operations"])
app.include_router(lobstr_processor_router, prefix="/api/v1", tags=["Lobstr Processor"])
app.include_router(tweet_enrichment_router, prefix="/api/v1", tags=["Tweet Enrichment"])

if settings.SENTRY_DSN:
    init_sentry(settings.SENTRY_DSN)

@app.get("/")
def root():
    return {
        "service": "NFF Data Ingestion Service",
        "version": "3.0.0",
        "description": "Enhanced data preprocessing and cleaning service",
        "api_docs": "/docs",
        "health": "/api/v1/health",
        "endpoints": {
            "indicators": "/api/v1/indicators",
            "etl": "/api/v1/etl",
            "cache": "/api/v1/cache",
            "health": "/api/v1/health"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "nff-data-ingestion"}

def main(event, context):   
    try:
        return {
            "statusCode": 200,
            "body": {
                "status": "success", 
                "message": "Scheduled data ingestion task completed",
                "event": event
            }
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": {
                "status": "error",
                "message": f"Scheduled task failed: {str(e)}"
            }
        }

if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)