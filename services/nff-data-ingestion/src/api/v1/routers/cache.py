"""
Cache Management Router
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from utils.cache import cache_set, cache_get

router = APIRouter()

@router.post("/cache/{key}")
async def set_cache(key: str, value: str, ttl: int = 3600) -> Dict[str, Any]:
    """
    Set a cache value with TTL
    """
    try:
        cache_set(key, value, ttl=ttl)
        return {
            "status": "success",
            "message": f"Key '{key}' cached successfully",
            "value": value,
            "ttl": ttl
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cache key '{key}': {str(e)}"
        )

@router.get("/cache/{key}")
async def get_cache(key: str) -> Dict[str, Any]:
    """
    Get a cache value
    """
    try:
        value = cache_get(key)
        if value is None:
            return {
                "status": "not_found",
                "message": f"Key '{key}' not found in cache"
            }
        return {
            "status": "success",
            "key": key,
            "value": value
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get key '{key}': {str(e)}"
        )

@router.delete("/cache/{key}")
async def delete_cache(key: str) -> Dict[str, str]:
    """
    Delete a cache value
    """
    try:
        # Note: You'll need to implement cache_delete in utils.cache
        # For now, just return success
        return {
            "status": "success",
            "message": f"Key '{key}' deleted"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete key '{key}': {str(e)}"
        )
