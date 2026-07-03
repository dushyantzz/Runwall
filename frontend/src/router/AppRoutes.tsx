import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import GovernancePage from '@/features/governance/GovernancePage';
import IdentityPage from '@/features/identity/IdentityPage';
import APIKeysPage from '@/features/api-keys/APIKeysPage';
import RiskPage from '@/features/risk/RiskPage';
import QuotasPage from '@/features/quotas/QuotasPage';
import ApprovalsPage from '@/features/approvals/ApprovalsPage';
import ContractsPage from '@/features/contracts/ContractsPage';
import ConnectorsPage from '@/features/connectors/ConnectorsPage';
import AuditPage from '@/features/audit/AuditPage';
import PoliciesPage from '@/features/policies/PoliciesPage';
import DocsPage from '@/features/docs/DocsPage';

export function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/governance" element={<GovernancePage />} />
        <Route path="/dashboard/identity" element={<IdentityPage />} />
        <Route path="/dashboard/api-keys" element={<APIKeysPage />} />
        <Route path="/dashboard/risk" element={<RiskPage />} />
        <Route path="/dashboard/quotas" element={<QuotasPage />} />
        <Route path="/dashboard/approvals" element={<ApprovalsPage />} />
        <Route path="/dashboard/contracts" element={<ContractsPage />} />
        <Route path="/dashboard/connectors" element={<ConnectorsPage />} />
        <Route path="/dashboard/audit" element={<AuditPage />} />
        <Route path="/dashboard/policies" element={<PoliciesPage />} />
        <Route path="/dashboard/docs" element={<DocsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}
