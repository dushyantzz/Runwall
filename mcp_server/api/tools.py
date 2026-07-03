"""Tool management endpoints."""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import structlog

from ..core.tool_manager import ToolManager, Tool
from ..core.security import SecurityManager
from ..config import get_settings
from .auth import get_current_user

logger = structlog.get_logger()
router = APIRouter()


class ToolResponse(BaseModel):
    """Tool response model."""
    name: str
    description: str
    category: str
    input_schema: Dict[str, Any]
    is_active: bool
    permissions: List[str]
    rate_limit: int
    timeout: int


class ToolExecuteRequest(BaseModel):
    """Tool execution request model."""
    tool_name: str
    arguments: Dict[str, Any]


class ToolExecuteResponse(BaseModel):
    """Tool execution response model."""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    execution_time: float
    tool_name: str


class ToolStatsResponse(BaseModel):
    """Tool statistics response model."""
    tool_name: str
    execution_count: int
    success_count: int
    error_count: int
    avg_execution_time: float
    success_rate: float


def get_tool_manager() -> ToolManager:
    """Get tool manager dependency."""
    settings = get_settings()
    return ToolManager(settings)


@router.get("/", response_model=List[ToolResponse])
async def list_tools(
    current_user: dict = Depends(get_current_user),
    tool_manager: ToolManager = Depends(get_tool_manager)
) -> List[ToolResponse]:
    """List all available tools for the current user."""
    user_id = current_user["sub"]
    tenant_id = current_user.get("tenant_id", "default")
    
    tools = await tool_manager.get_available_tools(user_id, tenant_id)
    
    return [
        ToolResponse(
            name=tool.name,
            description=tool.description,
            category=tool.category,
            input_schema=tool.input_schema,
            is_active=tool.is_active,
            permissions=tool.permissions,
            rate_limit=tool.rate_limit,
            timeout=tool.timeout
        )
        for tool in tools
    ]


@router.get("/{tool_name}", response_model=ToolResponse)
async def get_tool(
    tool_name: str,
    current_user: dict = Depends(get_current_user),
    tool_manager: ToolManager = Depends(get_tool_manager)
) -> ToolResponse:
    """Get details of a specific tool."""
    user_id = current_user["sub"]
    tenant_id = current_user.get("tenant_id", "default")
    
    tools = await tool_manager.get_available_tools(user_id, tenant_id)
    tool = next((t for t in tools if t.name == tool_name), None)
    
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tool '{tool_name}' not found"
        )
    
    return ToolResponse(
        name=tool.name,
        description=tool.description,
        category=tool.category,
        input_schema=tool.input_schema,
        is_active=tool.is_active,
        permissions=tool.permissions,
        rate_limit=tool.rate_limit,
        timeout=tool.timeout
    )


@router.post("/execute", response_model=ToolExecuteResponse)
async def execute_tool(
    request: ToolExecuteRequest,
    current_user: dict = Depends(get_current_user),
    tool_manager: ToolManager = Depends(get_tool_manager)
) -> ToolExecuteResponse:
    """Execute a tool with given arguments."""
    user_id = current_user["sub"]
    tenant_id = current_user.get("tenant_id", "default")
    
    start_time = time.time()
    
    try:
        result = await tool_manager.execute_tool(
            tool_name=request.tool_name,
            arguments=request.arguments,
            user_id=user_id,
            tenant_id=tenant_id,
            session_id=None  # Could be extracted from request context
        )
        
        execution_time = time.time() - start_time
        
        logger.info(
            "Tool executed successfully",
            tool_name=request.tool_name,
            user_id=user_id,
            execution_time=execution_time
        )
        
        return ToolExecuteResponse(
            success=True,
            result=result,
            execution_time=execution_time,
            tool_name=request.tool_name
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        
        logger.error(
            "Tool execution failed",
            tool_name=request.tool_name,
            user_id=user_id,
            error=str(e),
            execution_time=execution_time
        )
        
        return ToolExecuteResponse(
            success=False,
            error=str(e),
            execution_time=execution_time,
            tool_name=request.tool_name
        )


@router.get("/stats/", response_model=List[ToolStatsResponse])
async def get_tool_stats(
    current_user: dict = Depends(get_current_user),
    tool_manager: ToolManager = Depends(get_tool_manager)
) -> List[ToolStatsResponse]:
    """Get statistics for all tools."""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    stats = await tool_manager.get_tool_stats()
    
    return [
        ToolStatsResponse(
            tool_name=tool_name,
            execution_count=tool_stats.get("execution_count", 0),
            success_count=tool_stats.get("success_count", 0),
            error_count=tool_stats.get("error_count", 0),
            avg_execution_time=tool_stats.get("avg_execution_time", 0.0),
            success_rate=(
                tool_stats.get("success_count", 0) / 
                max(tool_stats.get("execution_count", 1), 1) * 100
            )
        )
        for tool_name, tool_stats in stats.items()
    ]


@router.get("/stats/{tool_name}", response_model=ToolStatsResponse)
async def get_tool_stat(
    tool_name: str,
    current_user: dict = Depends(get_current_user),
    tool_manager: ToolManager = Depends(get_tool_manager)
) -> ToolStatsResponse:
    """Get statistics for a specific tool."""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    tool_stats = await tool_manager.get_tool_stats(tool_name)
    
    if not tool_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tool '{tool_name}' not found"
        )
    
    return ToolStatsResponse(
        tool_name=tool_name,
        execution_count=tool_stats.get("execution_count", 0),
        success_count=tool_stats.get("success_count", 0),
        error_count=tool_stats.get("error_count", 0),
        avg_execution_time=tool_stats.get("avg_execution_time", 0.0),
        success_rate=(
            tool_stats.get("success_count", 0) / 
            max(tool_stats.get("execution_count", 1), 1) * 100
        )
    )


@router.get("/categories/")
async def get_tool_categories(
    current_user: dict = Depends(get_current_user),
    tool_manager: ToolManager = Depends(get_tool_manager)
) -> List[str]:
    """Get list of tool categories."""
    user_id = current_user["sub"]
    tenant_id = current_user.get("tenant_id", "default")
    
    tools = await tool_manager.get_available_tools(user_id, tenant_id)
    categories = list(set(tool.category for tool in tools))
    
    return sorted(categories)