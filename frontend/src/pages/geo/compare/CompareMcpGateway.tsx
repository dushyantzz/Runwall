import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Runwall vs. MCP Gateways — Policy-Aware Agent Governance | Runwall',
  description: 'How Runwall differs from generic MCP gateways. Runwall adds policy enforcement, risk scoring, taint tracking, and approval workflows that basic MCP gateways lack.',
  path: '/compare/mcp-gateway',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Compare', href: 'https://runwall.in/compare/mcp-gateway' },
    { name: 'vs. MCP Gateways', href: 'https://runwall.in/compare/mcp-gateway' },
  ],
  content: [
    'Generic MCP gateways route tool calls between agents and MCP servers — they handle transport, tool discovery, and basic access control. But routing alone is not governance. A generic gateway lets an agent call any registered tool with any parameters, as long as the connection is authenticated. It does not evaluate the intent or risk of the action, track data flow across the session, or support approval workflows for gray-zone decisions.',
    'Runwall is an execution governance layer, not a routing gateway. It understands the semantic context of each tool call and evaluates it against OPA/Rego policies, computes a risk score, tracks taint state, supports human-in-the-loop approval, and logs every decision immutably. The difference is between "can this agent reach this tool" (gateway) and "should this specific action, in this context, be permitted" (governance).',
  ],
  sections: [
    {
      heading: 'What a Generic MCP Gateway Provides',
      body: 'Transport management (stdio, HTTP/SSE), tool discovery and routing, basic authentication (API key or token), connection pooling, and error forwarding. These are necessary capabilities, but they do not constitute governance — they are infrastructure plumbing.',
    },
    {
      heading: 'What Runwall Adds Beyond Routing',
      body: 'OPA/Rego policy evaluation on every tool call. Real-time risk scoring based on tool type, parameters, session context, and taint state. Session-level taint tracking for data flow control. Three-mode approval workflows (ask human, log-and-allow, hard block). Immutable audit logging with evidence replay. Per-tenant governance isolation. Rate limits and quotas. Rollback and compensating actions. The governance pipeline runs inline on every request — it is not optional or bolted-on.',
    },
  ],
  faqs: [
    {
      question: 'What is the difference between Runwall and a generic MCP gateway?',
      answer: 'A generic MCP gateway routes tool calls between agents and tools — it handles transport and basic auth. Runwall is an execution governance layer that evaluates every tool call against policy, scores its risk, tracks data flow, supports approval workflows, and logs decisions immutably. The difference is routing vs. governance.',
    },
    {
      question: 'Do I still need an MCP gateway if I use Runwall?',
      answer: 'No. Runwall includes full MCP Protocol Broker functionality — it handles tool discovery, request routing, transport management, and error handling. You do not need a separate gateway in front of or behind Runwall.',
    },
    {
      question: 'Can a generic MCP gateway enforce policies on tool calls?',
      answer: 'Most generic MCP gateways provide only basic access control (which agents can connect, which tools are listed). They do not evaluate per-call policy rules, compute risk scores, track data flow, or support approval workflows. Runwall provides all of these as core capabilities.',
    },
  ],
  relatedLinks: [
    { label: 'Runwall vs. API Gateways', to: '/compare/api-gateway' },
    { label: 'Runwall vs. Agent Observability', to: '/compare/agent-observability' },
    { label: 'MCP Protocol Documentation', to: '/docs/mcp' },
    { label: 'MCP Gateway (Pillar)', to: '/mcp-gateway' },
  ],
};

export default function CompareMcpGateway() {
  return <GeoPageTemplate data={data} />;
}
