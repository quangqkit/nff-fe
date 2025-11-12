"""
Health Check Router
"""

from fastapi import APIRouter, Depends
from typing import Dict, Any
import psycopg2
from config import settings

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Comprehensive health check for the service
    """
    health_status = {
        "status": "ok",
        "service": "nff-data-ingestion",
        "version": "3.0.0",
        "checks": {}
    }
    
    # Database connectivity check
    try:
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.close()
        health_status["checks"]["database"] = {
            "status": "ok",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "error",
            "message": f"Database connection failed: {str(e)}"
        }
        health_status["status"] = "error"
    
    # API Keys check
    api_keys_status = {}
    import os
    environment = os.getenv('ENVIRONMENT', 'development')
    
    if settings.FRED_API_KEY:
        api_keys_status["fred"] = "configured ✅"
    else:
        api_keys_status["fred"] = "missing ⚠️ (will use mock data in development)"
        
    if settings.POLYGON_API_KEY:
        api_keys_status["polygon"] = "configured ✅"
    else:
        api_keys_status["polygon"] = "missing ⚠️ (will use mock data)"
    
    health_status["checks"]["api_keys"] = api_keys_status
    health_status["environment"] = environment
    health_status["mode"] = "🔧 DEVELOPMENT MODE (mock data enabled)" if not settings.FRED_API_KEY else "🚀 PRODUCTION MODE (real API calls)"
    
    return health_status

@router.get("/health/ready")
async def readiness_check() -> Dict[str, str]:
    """
    Kubernetes readiness probe endpoint
    """
    return {"status": "ready"}

@router.get("/health/live")
async def liveness_check() -> Dict[str, str]:
    """
    Kubernetes liveness probe endpoint
    """
    return {"status": "alive"}
