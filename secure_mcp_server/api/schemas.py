from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime

class PolicyBundleDeployRequest(BaseModel):
    version: str = Field(..., description="Version of the policy bundle")
    rego_content: str = Field(..., description="Raw Rego policy string")
    is_active: bool = Field(False, description="Make this bundle active upon deployment")
    is_simulation_mode: bool = Field(False, description="Run policies in simulation/dry-run mode")
    rollout_percentage: int = Field(100, description="Percentage of traffic to route to this policy")

class ApprovalReviewRequest(BaseModel):
    decision: str = Field(..., description="'APPROVED' or 'REJECTED'")
    reason: str = Field(..., description="Justification for the decision")

class AuditLogResponse(BaseModel):
    id: int
    tenant_id: str
    user_id: Optional[str]
    tool_name: str
    action: str
    status: str
    execution_time_ms: float
    created_at: datetime
    
class PolicyDecisionResponse(BaseModel):
    id: int
    tenant_id: str
    user_id: Optional[str]
    decision: str
    explanation: str
    created_at: datetime
    context_snapshot: Dict[str, Any]
