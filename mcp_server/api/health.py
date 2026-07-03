"""Health check endpoints."""

from fastapi import APIRouter, Depends
from typing import Dict, Any
import structlog

from ..core.monitoring import MetricsCollector
from ..database.connection import DatabaseManager

logger = structlog.get_logger()
router = APIRouter()


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "MCP Server Framework",
        "version": "0.1.0"
    }


@router.get("/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check with component status."""
    # Check database health
    try:
        from ..database.connection import get_db_manager
        db_manager = get_db_manager()
        db_healthy = await db_manager.health_check()
    except Exception:
        db_healthy = False
    
    # Overall health status
    overall_status = "healthy" if db_healthy else "unhealthy"
    
    return {
        "status": overall_status,
        "service": "MCP Server Framework",
        "version": "0.1.0",
        "components": {
            "database": "healthy" if db_healthy else "unhealthy",
            "api": "healthy",
            "metrics": "healthy"
        }
    }


@router.get("/metrics")
async def health_metrics() -> Dict[str, Any]:
    """Health metrics endpoint."""
    # This would typically return Prometheus metrics
    # For now, return basic system info
    import psutil
    import time
    
    process = psutil.Process()
    
    return {
        "timestamp": time.time(),
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent
        },
        "process": {
            "memory_mb": process.memory_info().rss / 1024 / 1024,
            "cpu_percent": process.cpu_percent(),
            "threads": process.num_threads()
        }
    }