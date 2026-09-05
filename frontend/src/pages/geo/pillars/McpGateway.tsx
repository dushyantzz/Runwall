import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'MCP Gateway — Secure Proxy for Model Context Protocol | Runwall',
  description: 'Runwall as an MCP gateway: how the governance proxy sits in the Model Context Protocol handshake between AI agents and tools, adding policy enforcement, risk scoring, and audit logging.',
  path: '/mcp-gateway',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'MCP Gateway', href: 'https://runwall.in/mcp-gateway' },
  ],
  content: [
    'The Model Context Protocol (MCP) defines how AI agents discover and invoke tools — file systems, databases, APIs, terminals, and custom services. As MCP becomes the standard protocol for agent-to-tool communication, the MCP gateway becomes the critical control point for agent security and governance. Runwall operates as a governance-aware MCP gateway that sits in the protocol handshake between agents and tools, applying policy enforcement, risk scoring, taint tracking, and audit logging to every tool call.',
    'Unlike generic MCP proxies that only handle routing and transport, Runwall understands the semantic content of MCP tool calls. It knows that "execute_command" with {"command": "npm test"} is categorically different from {"command": "rm -rf /"}, and it evaluates each call against context-aware policies. This protocol-level governance is what makes Runwall an MCP security gateway, not just an MCP proxy.',
  ],
  sections: [
    {
      heading: 'How Runwall Sits in the MCP Handshake',
      body: 'When an agent connects to Runwall, the MCP Protocol Broker establishes a session with the agent (acting as an MCP server) and separate sessions with each registered downstream MCP server (acting as an MCP client). Tool lists from all downstream servers are aggregated and presented to the agent. When the agent calls a tool, the request passes through Runwall\'s governance pipeline — identity verification, policy evaluation, risk scoring, taint check — before being forwarded to the target tool. The response is then forwarded back to the agent. The entire process is transparent to both the agent and the tool.',
    },
    {
      heading: 'MCP Security Gateway vs. MCP Proxy',
      body: 'An MCP proxy forwards requests. An MCP security gateway evaluates requests. Runwall provides both: it handles the transport and routing responsibilities of a proxy, while adding the governance capabilities of a security gateway — per-call policy evaluation, risk scoring, data flow tracking, approval workflows, and immutable audit logging. This combined approach means organizations don\'t need separate tools for MCP routing and MCP governance.',
    },
  ],
  faqs: [
    {
      question: 'What is an MCP gateway?',
      answer: 'An MCP gateway is a proxy that sits between AI agents and MCP tool servers, managing tool discovery, request routing, and transport. Runwall extends this with governance: policy enforcement, risk scoring, taint tracking, approval workflows, and audit logging on every tool call — making it an MCP security gateway.',
    },
    {
      question: 'How does Runwall work as an MCP proxy?',
      answer: 'Runwall accepts MCP connections from agents (as a server) and establishes connections to downstream MCP tool servers (as a client). Tool calls from the agent pass through Runwall\'s governance pipeline before reaching the target tool. Responses are forwarded back transparently. Both stdio and HTTP/SSE transports are supported.',
    },
    {
      question: 'Is MCP security the same as API security?',
      answer: 'No. MCP security requires understanding the semantic content of tool calls — the tool name, parameters, and session context — which is specific to the MCP protocol. API security typically operates at the HTTP level (routes, methods, headers). Runwall provides MCP-native security that understands the protocol\'s semantics, which generic API security tools cannot.',
    },
    {
      question: 'Can Runwall replace my existing MCP proxy?',
      answer: 'Yes. Runwall includes full MCP Protocol Broker functionality — tool discovery, request routing, transport management, and error handling. It replaces a generic MCP proxy while adding governance capabilities that generic proxies lack.',
    },
  ],
  relatedLinks: [
    { label: 'MCP Protocol Documentation', to: '/docs/mcp' },
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'MCP Security Research', to: '/research/mcp-security' },
    { label: 'Runwall vs. MCP Gateways', to: '/compare/mcp-gateway' },
    { label: 'Runwall vs. API Gateways', to: '/compare/api-gateway' },
    { label: 'Getting Started', to: '/docs/getting-started' },
  ],
};

export default function McpGateway() {
  return <GeoPageTemplate data={data} />;
}
