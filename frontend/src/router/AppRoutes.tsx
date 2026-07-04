import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import HomePage from '@/pages/HomePage';
import IdentityAccessControl from '@/pages/features/IdentityAccessControl';
import TenantManagement from '@/pages/features/TenantManagement';
import ToolMcpRegistry from '@/pages/features/ToolMcpRegistry';
import PolicyEngine from '@/pages/features/PolicyEngine';
import RuntimeInterceptor from '@/pages/features/RuntimeInterceptor';
import RiskScoringEngine from '@/pages/features/RiskScoringEngine';
import TaintTrackingEngine from '@/pages/features/TaintTrackingEngine';
import ApprovalWorkflowEngine from '@/pages/features/ApprovalWorkflowEngine';
import AuditEvidenceReplay from '@/pages/features/AuditEvidenceReplay';
import RollbackCompensating from '@/pages/features/RollbackCompensating';
import QuotasBudgetsRateLimits from '@/pages/features/QuotasBudgetsRateLimits';
import SandboxingExecutionProfiles from '@/pages/features/SandboxingExecutionProfiles';

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Feature Pages */}
        <Route path="/features/identity-access-control" element={<IdentityAccessControl />} />
        <Route path="/features/tenant-management" element={<TenantManagement />} />
        <Route path="/features/tool-mcp-registry" element={<ToolMcpRegistry />} />
        <Route path="/features/policy-engine" element={<PolicyEngine />} />
        <Route path="/features/runtime-interceptor" element={<RuntimeInterceptor />} />
        <Route path="/features/risk-scoring-engine" element={<RiskScoringEngine />} />
        <Route path="/features/taint-tracking-engine" element={<TaintTrackingEngine />} />
        <Route path="/features/approval-workflow-engine" element={<ApprovalWorkflowEngine />} />
        <Route path="/features/audit-evidence-replay" element={<AuditEvidenceReplay />} />
        <Route path="/features/rollback-compensating" element={<RollbackCompensating />} />
        <Route path="/features/quotas-budgets-rate-limits" element={<QuotasBudgetsRateLimits />} />
        <Route path="/features/sandboxing-execution-profiles" element={<SandboxingExecutionProfiles />} />

        {/* Placeholder routes — redirect to home */}
        <Route path="/pricing" element={<HomePage />} />
        <Route path="/docs" element={<HomePage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
