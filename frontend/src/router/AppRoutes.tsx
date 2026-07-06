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
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ProtectedRoute from '@/components/ProtectedRoute';

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Home */}
        <Route path="/" element={<HomePage />} />

        {/* Feature Pages (Protected) */}
        <Route path="/features/identity-access-control" element={<ProtectedRoute><IdentityAccessControl /></ProtectedRoute>} />
        <Route path="/features/tenant-management" element={<ProtectedRoute><TenantManagement /></ProtectedRoute>} />
        <Route path="/features/tool-mcp-registry" element={<ProtectedRoute><ToolMcpRegistry /></ProtectedRoute>} />
        <Route path="/features/policy-engine" element={<ProtectedRoute><PolicyEngine /></ProtectedRoute>} />
        <Route path="/features/runtime-interceptor" element={<ProtectedRoute><RuntimeInterceptor /></ProtectedRoute>} />
        <Route path="/features/risk-scoring-engine" element={<ProtectedRoute><RiskScoringEngine /></ProtectedRoute>} />
        <Route path="/features/taint-tracking-engine" element={<ProtectedRoute><TaintTrackingEngine /></ProtectedRoute>} />
        <Route path="/features/approval-workflow-engine" element={<ProtectedRoute><ApprovalWorkflowEngine /></ProtectedRoute>} />
        <Route path="/features/audit-evidence-replay" element={<ProtectedRoute><AuditEvidenceReplay /></ProtectedRoute>} />
        <Route path="/features/rollback-compensating" element={<ProtectedRoute><RollbackCompensating /></ProtectedRoute>} />
        <Route path="/features/quotas-budgets-rate-limits" element={<ProtectedRoute><QuotasBudgetsRateLimits /></ProtectedRoute>} />
        <Route path="/features/sandboxing-execution-profiles" element={<ProtectedRoute><SandboxingExecutionProfiles /></ProtectedRoute>} />

        {/* Placeholder routes */}
        <Route path="/pricing" element={<HomePage />} />
        <Route path="/docs" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
