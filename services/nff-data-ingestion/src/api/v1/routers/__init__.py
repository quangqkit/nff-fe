"""
API v1 Routers
"""

from .indicators import router as indicators_router
from .etl import router as etl_router
from .health import router as health_router
from .cache import router as cache_router

__all__ = [
    "indicators_router",
    "etl_router", 
    "health_router",
    "cache_router",
]
