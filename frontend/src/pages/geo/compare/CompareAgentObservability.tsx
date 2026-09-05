import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Runwall vs. Agent Observability Tools — Enforcement vs. Monitoring | Runwall',
  description: 'How Runwall differs from agent observability and monitoring tools. Observability tools watch and record; Runwall enforces governance policies before execution.',
  path: '/compare/agent-observability',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Compare', href: 'https://runwall.in/compare/agent-observability' },
    { name: 'vs. Agent Observability', href: 'https://runwall.in/compare/agent-observability' },
  ],
  content: [
    'Agent observability tools (LangSmith, Helicone, Arize, etc.) provide monitoring, tracing, and analytics for AI agent workflows. They record what agents do — token usage, latency, error rates, tool call sequences — and present dashboards for debugging and optimization. They are valuable for understanding agent behavior after the fact.',
    'Runwall operates before execution, not after. It intercepts every tool call inline, evaluates it against policy, and makes an enforcement decision (allow, deny, or require approval) before the action reaches the target tool. Observability tools tell you what happened; Runwall determines what is allowed to happen. The two are complementary — Runwall enforces governance in real time, and observability tools provide post-hoc analysis and debugging.',
  ],
  sections: [
    {
      heading: 'The Enforcement Gap',
      body: 'Monitoring alone cannot prevent damage. An observability tool that records an agent executing "rm -rf /" provides an excellent post-mortem record, but the files are already deleted. Runwall catches that command before it executes — risk-scoring it, evaluating it against policy, and blocking or routing it for approval. Enforcement must happen inline, before execution, to prevent damage rather than document it.',
    },
  ],
  faqs: [
    {
      question: 'Is Runwall an agent observability tool?',
      answer: 'No. Runwall is an execution governance layer, not an observability tool. It enforces policies before tool calls execute. However, Runwall does include an immutable audit log and evidence replay — so it provides a governance-focused record of agent actions alongside enforcement.',
    },
    {
      question: 'Can I use Runwall together with LangSmith or Helicone?',
      answer: 'Yes. Runwall and observability tools are complementary. Runwall enforces governance policies inline (blocking dangerous actions before they execute), while observability tools provide analytics, tracing, and debugging dashboards. Use both for comprehensive agent management.',
    },
    {
      question: 'Does Runwall provide monitoring dashboards?',
      answer: 'Runwall provides audit logs and evidence replay for governance-focused analysis — reviewing policy decisions, investigating incidents, and replaying agent sessions. For general-purpose monitoring (token usage, latency, error rates), dedicated observability tools are a better fit.',
    },
  ],
  relatedLinks: [
    { label: 'Runwall vs. MCP Gateways', to: '/compare/mcp-gateway' },
    { label: 'Runwall vs. API Gateways', to: '/compare/api-gateway' },
    { label: 'Audit Log Documentation', to: '/docs/audit' },
    { label: 'AI Agent Firewall (Pillar)', to: '/ai-agent-firewall' },
  ],
};

export default function CompareAgentObservability() {
  return <GeoPageTemplate data={data} />;
}
