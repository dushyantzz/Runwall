import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppLayout from '@/layout/AppLayout';
import HomePage from '@/pages/HomePage';

// Lazy-loaded routes — only fetched when navigated to
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const SignupPage = lazy(() => import('@/pages/SignupPage'));
const DocsPage = lazy(() => import('@/pages/DocsPage'));
const PricingPage = lazy(() => import('@/pages/PricingPage'));

// ── GEO Pages: Security ──
const SecurityIndex = lazy(() => import('@/pages/geo/security/SecurityIndex'));
const SecurityArchitecture = lazy(() => import('@/pages/geo/security/SecurityArchitecture'));
const SecurityThreatModel = lazy(() => import('@/pages/geo/security/SecurityThreatModel'));
const SecurityTesting = lazy(() => import('@/pages/geo/security/SecurityTesting'));
const ResponsibleDisclosure = lazy(() => import('@/pages/geo/security/ResponsibleDisclosure'));

// ── GEO Pages: Docs ──
const DocsGettingStarted = lazy(() => import('@/pages/geo/docs/DocsGettingStarted'));
const DocsMcp = lazy(() => import('@/pages/geo/docs/DocsMcp'));
const DocsPolicies = lazy(() => import('@/pages/geo/docs/DocsPolicies'));
const DocsRisk = lazy(() => import('@/pages/geo/docs/DocsRisk'));
const DocsTaint = lazy(() => import('@/pages/geo/docs/DocsTaint'));
const DocsApprovals = lazy(() => import('@/pages/geo/docs/DocsApprovals'));
const DocsAudit = lazy(() => import('@/pages/geo/docs/DocsAudit'));

// ── GEO Pages: Use Cases ──
const UseCasesCodingAgents = lazy(() => import('@/pages/geo/use-cases/UseCasesCodingAgents'));
const UseCasesEnterpriseMcp = lazy(() => import('@/pages/geo/use-cases/UseCasesEnterpriseMcp'));
const UseCasesAutonomousAgents = lazy(() => import('@/pages/geo/use-cases/UseCasesAutonomousAgents'));
const UseCasesSensitiveData = lazy(() => import('@/pages/geo/use-cases/UseCasesSensitiveData'));

// ── GEO Pages: Integrations ──
const IntegrationClaudeCode = lazy(() => import('@/pages/geo/integrations/IntegrationClaudeCode'));
const IntegrationCodex = lazy(() => import('@/pages/geo/integrations/IntegrationCodex'));
const IntegrationCursor = lazy(() => import('@/pages/geo/integrations/IntegrationCursor'));
const IntegrationCline = lazy(() => import('@/pages/geo/integrations/IntegrationCline'));
const IntegrationCustomAgents = lazy(() => import('@/pages/geo/integrations/IntegrationCustomAgents'));

// ── GEO Pages: Compare ──
const CompareMcpGateway = lazy(() => import('@/pages/geo/compare/CompareMcpGateway'));
const CompareApiGateway = lazy(() => import('@/pages/geo/compare/CompareApiGateway'));
const CompareAgentObservability = lazy(() => import('@/pages/geo/compare/CompareAgentObservability'));

// ── GEO Pages: Research ──
const ResearchMcpSecurity = lazy(() => import('@/pages/geo/research/ResearchMcpSecurity'));
const ResearchAgentSecurity = lazy(() => import('@/pages/geo/research/ResearchAgentSecurity'));
const ResearchAgentGovernance = lazy(() => import('@/pages/geo/research/ResearchAgentGovernance'));
const ResearchToolSecurity = lazy(() => import('@/pages/geo/research/ResearchToolSecurity'));

// ── GEO Pages: Pillar Pages ──
const AiAgentSecurity = lazy(() => import('@/pages/geo/pillars/AiAgentSecurity'));
const AiAgentGovernance = lazy(() => import('@/pages/geo/pillars/AiAgentGovernance'));
const McpGatewayPillar = lazy(() => import('@/pages/geo/pillars/McpGateway'));
const AiAgentFirewall = lazy(() => import('@/pages/geo/pillars/AiAgentFirewall'));

function FeaturesRedirect() {
  const { pageId } = useParams<{ pageId: string }>();
  return <Navigate to={`/docs/${pageId}`} replace />;
}

// Minimal fallback — keeps TBT at 0ms, no layout shift
function PageFallback() {
  return (
    <div style={{ minHeight: '100vh', background: '#000' }} />
  );
}

export function AppRoutes() {
  return (
    <AppLayout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Public Home & Pricing */}
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />

          {/* ── GEO: Security Section ── */}
          <Route path="/security" element={<SecurityIndex />} />
          <Route path="/security/architecture" element={<SecurityArchitecture />} />
          <Route path="/security/threat-model" element={<SecurityThreatModel />} />
          <Route path="/security/testing" element={<SecurityTesting />} />
          <Route path="/security/responsible-disclosure" element={<ResponsibleDisclosure />} />

          {/* ── GEO: Docs Section (new standalone GEO pages) ── */}
          <Route path="/docs/getting-started" element={<DocsGettingStarted />} />
          <Route path="/docs/mcp" element={<DocsMcp />} />
          <Route path="/docs/policies" element={<DocsPolicies />} />
          <Route path="/docs/risk" element={<DocsRisk />} />
          <Route path="/docs/taint" element={<DocsTaint />} />
          <Route path="/docs/approvals" element={<DocsApprovals />} />
          <Route path="/docs/audit" element={<DocsAudit />} />

          {/* ── GEO: Use Cases Section ── */}
          <Route path="/use-cases/coding-agents" element={<UseCasesCodingAgents />} />
          <Route path="/use-cases/enterprise-mcp" element={<UseCasesEnterpriseMcp />} />
          <Route path="/use-cases/autonomous-agents" element={<UseCasesAutonomousAgents />} />
          <Route path="/use-cases/sensitive-data" element={<UseCasesSensitiveData />} />

          {/* ── GEO: Integrations Section ── */}
          <Route path="/integrations/claude-code" element={<IntegrationClaudeCode />} />
          <Route path="/integrations/codex" element={<IntegrationCodex />} />
          <Route path="/integrations/cursor" element={<IntegrationCursor />} />
          <Route path="/integrations/cline" element={<IntegrationCline />} />
          <Route path="/integrations/custom-agents" element={<IntegrationCustomAgents />} />

          {/* ── GEO: Compare Section ── */}
          <Route path="/compare/mcp-gateway" element={<CompareMcpGateway />} />
          <Route path="/compare/api-gateway" element={<CompareApiGateway />} />
          <Route path="/compare/agent-observability" element={<CompareAgentObservability />} />

          {/* ── GEO: Research Section ── */}
          <Route path="/research/mcp-security" element={<ResearchMcpSecurity />} />
          <Route path="/research/agent-security" element={<ResearchAgentSecurity />} />
          <Route path="/research/agent-governance" element={<ResearchAgentGovernance />} />
          <Route path="/research/tool-security" element={<ResearchToolSecurity />} />

          {/* ── GEO: Pillar Pages ── */}
          <Route path="/ai-agent-security" element={<AiAgentSecurity />} />
          <Route path="/ai-agent-governance" element={<AiAgentGovernance />} />
          <Route path="/mcp-gateway" element={<McpGatewayPillar />} />
          <Route path="/ai-agent-firewall" element={<AiAgentFirewall />} />

          {/* ── GEO: Redirects ── */}
          <Route path="/mcp-security" element={<Navigate to="/mcp-gateway" replace />} />

          {/* ── Documentation Routes — Now Public (auth removed) ── */}
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/docs/:pageId" element={<DocsPage />} />

          {/* Legacy Features Redirects */}
          <Route path="/features/:pageId" element={<FeaturesRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
