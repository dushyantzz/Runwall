import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Runwall vs. API Gateways — Semantic Agent Governance | Runwall',
  description: 'How Runwall differs from traditional API gateways. API gateways handle routing and auth; Runwall provides intent-aware policy enforcement for AI agent tool calls.',
  path: '/compare/api-gateway',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Compare', href: 'https://runwall.in/compare/api-gateway' },
    { name: 'vs. API Gateways', href: 'https://runwall.in/compare/api-gateway' },
  ],
  content: [
    'Traditional API gateways (Kong, Apigee, AWS API Gateway) are designed for HTTP API traffic: they handle routing, rate limiting, basic authentication, and request transformation. They evaluate requests based on HTTP-level attributes — the URL path, headers, HTTP method, and payload size. They do not understand the semantic intent of a request or the data flow context of a multi-step workflow.',
    'Runwall operates at the MCP protocol level, not the HTTP level. It understands that a tool call to "execute_command" with parameters {"command": "rm -rf /"} is semantically different from {"command": "npm test"}, even though both are POST requests to the same endpoint. Runwall evaluates intent-aware policy (not just routing rules), tracks data taint across multi-step workflows (not just per-request), and supports human-in-the-loop approval gates — capabilities that traditional API gateways do not provide.',
  ],
  sections: [
    {
      heading: 'Where API Gateways Fall Short for Agent Governance',
      body: 'API gateways see requests as HTTP transactions. They cannot distinguish between a safe read and a dangerous write to the same endpoint (both are POST requests in MCP). They cannot track data flow across a session of tool calls. They cannot risk-score individual actions based on parameter content. They cannot route specific high-risk requests for human approval. And they do not understand the MCP protocol — tool names, parameters, and response types are opaque to them.',
    },
    {
      heading: 'When to Use an API Gateway vs. Runwall',
      body: 'Use an API gateway for standard HTTP API traffic management — rate limiting web APIs, managing API keys for REST services, load balancing. Use Runwall for governing AI agent tool calls through MCP — where you need intent-aware policy evaluation, data flow tracking, risk scoring, and approval workflows. The two are complementary, not competing — Runwall governs the agent-to-tool layer, while an API gateway can manage the HTTP layer in front of or behind Runwall.',
    },
  ],
  faqs: [
    {
      question: 'Can I use an API gateway instead of Runwall for AI agent governance?',
      answer: 'A traditional API gateway handles routing, rate limiting, and basic auth, but it cannot evaluate the semantic intent of agent tool calls, track data flow across multi-step workflows, risk-score individual actions, or support human-in-the-loop approval. Runwall provides these agent-specific governance capabilities that API gateways lack.',
    },
    {
      question: 'Is Runwall a replacement for an API gateway?',
      answer: 'No. Runwall and API gateways serve different purposes and are complementary. Runwall governs the agent-to-tool layer using MCP-level policy enforcement. An API gateway manages HTTP-level traffic. You can use both together — an API gateway in front of your HTTP services and Runwall governing the MCP agent layer.',
    },
    {
      question: 'What is "intent-aware" policy enforcement?',
      answer: 'Intent-aware policy means Runwall evaluates what an action means, not just what HTTP endpoint it targets. A tool call to "execute_command" with {"command": "npm test"} is evaluated differently from {"command": "rm -rf /"} — even though both would be identical POST requests to an API gateway. Runwall inspects tool names, parameter values, session context, and taint state.',
    },
  ],
  relatedLinks: [
    { label: 'Runwall vs. MCP Gateways', to: '/compare/mcp-gateway' },
    { label: 'Runwall vs. Agent Observability', to: '/compare/agent-observability' },
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
  ],
};

export default function CompareApiGateway() {
  return <GeoPageTemplate data={data} />;
}
