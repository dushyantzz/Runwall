import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Enterprise MCP Governance — Multi-Tenant Agent Security | Runwall',
  description: 'How Runwall provides multi-tenant execution governance for enterprise MCP deployments with per-tenant policies, SLA governance, and tenant isolation.',
  path: '/use-cases/enterprise-mcp',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Use Cases', href: 'https://runwall.in/use-cases/enterprise-mcp' },
    { name: 'Enterprise MCP', href: 'https://runwall.in/use-cases/enterprise-mcp' },
  ],
  content: [
    'Enterprise organizations deploying AI agents through MCP need governance that scales across multiple teams, tenants, and environments. Each tenant may have different security requirements, different allowed tools, different risk thresholds, and different compliance obligations. Runwall\'s multi-tenant architecture provides per-tenant governance rules, isolated policy evaluation, and SLA enforcement — all managed from a centralized platform.',
    'Runwall\'s Tenant Management layer isolates governance context between tenants. Each tenant has its own policy bundles, risk thresholds, approval workflows, rate limits, and audit logs. A policy change in one tenant does not affect another. This isolation is enforced at the governance engine level, not just at the API layer, ensuring that cross-tenant policy leakage cannot occur even under adversarial conditions.',
  ],
  sections: [
    {
      heading: 'Per-Tenant Governance Rules',
      body: 'Each tenant in Runwall can define its own Rego policy bundles, risk scoring thresholds, approval workflows, rate limits, and tool registry. A financial services tenant might require human approval for any database write, while a development team tenant might allow database writes freely but restrict terminal commands. These rules are evaluated independently per tenant.',
    },
    {
      heading: 'SLA Governance',
      body: 'Runwall\'s SLA Governance enforces uptime, latency, and throughput guarantees for agent workloads on a per-tenant basis. If a tenant\'s agent workload exceeds its SLA budget (e.g., too many tool calls per minute, or cumulative execution time exceeding a threshold), Runwall can throttle, queue, or block further actions to protect both the tenant and the shared infrastructure.',
    },
  ],
  faqs: [
    {
      question: 'Does Runwall support multi-tenant deployments?',
      answer: 'Yes. Runwall\'s Tenant Management layer provides full multi-tenant isolation with per-tenant policies, risk thresholds, approval workflows, rate limits, and audit logs. Each tenant\'s governance context is isolated at the engine level.',
    },
    {
      question: 'Can different teams have different governance rules?',
      answer: 'Yes. Each tenant (team or organization) defines its own Rego policy bundles, risk thresholds, approval configurations, and tool registries. A security-sensitive team can enforce strict policies while a development team can use more permissive rules — all within the same Runwall deployment.',
    },
    {
      question: 'What is SLA governance for AI agents?',
      answer: 'SLA governance enforces resource limits and performance guarantees per tenant. If an agent workload exceeds its allocated budget (tool calls per minute, cumulative execution time, API call quotas), Runwall can throttle, queue, or block further actions to maintain service levels across all tenants.',
    },
  ],
  relatedLinks: [
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Autonomous Agents Use Case', to: '/use-cases/autonomous-agents' },
    { label: 'Runwall vs. API Gateways', to: '/compare/api-gateway' },
    { label: 'AI Agent Governance (Pillar)', to: '/ai-agent-governance' },
  ],
};

export default function UseCasesEnterpriseMcp() {
  return <GeoPageTemplate data={data} />;
}
