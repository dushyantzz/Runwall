import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Security Architecture — Runwall',
  description: 'System architecture diagram and technical explanation of how Runwall\'s governance layer sits between AI agents and MCP tools to enforce zero-trust execution policies.',
  path: '/security/architecture',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Security', href: 'https://runwall.in/security' },
    { name: 'Architecture', href: 'https://runwall.in/security/architecture' },
  ],
  content: [
    'Runwall operates as an inline governance proxy positioned between AI agents and the MCP (Model Context Protocol) servers they connect to. When an agent issues a tool call — whether it\'s reading a file, querying a database, or executing a terminal command — the request passes through Runwall before reaching the target tool. Runwall evaluates the request against the full governance pipeline and either allows it, blocks it, or routes it for human approval.',
    'The architecture is designed so that agents require zero code changes to operate through Runwall. From the agent\'s perspective, Runwall is just another MCP server. From the tool\'s perspective, Runwall is just another MCP client. This transparent proxy model means Runwall can be deployed in front of any MCP-compliant tool without modifying either the agent or the tool.',
  ],
  sections: [
    {
      heading: 'Governance Pipeline',
      body: 'Each tool call traverses a sequential governance pipeline: (1) Identity verification — the agent session is authenticated via OAuth token or API key. (2) Policy evaluation — the request is evaluated against OPA/Rego policies that encode per-tool, per-agent, per-tenant rules. (3) Risk scoring — a real-time risk score is computed from the tool type, parameters, session context, and taint state. (4) Taint check — if the session has been flagged as tainted (the agent ingested untrusted input), downstream sink actions are restricted. (5) Approval routing — if the risk score or policy result falls in the "gray zone," the request is routed to a human approver. (6) Execution — if all checks pass, the request is forwarded to the target MCP tool. (7) Audit logging — the complete decision context, including policy version, risk score, and execution result, is written to an immutable audit log.',
    },
    {
      heading: 'Protocol Broker',
      body: 'Runwall\'s MCP Protocol Broker handles the bidirectional MCP handshake between agents and tools. It manages tool discovery (listing available tools for the agent), request serialization, response forwarding, and error handling. The broker supports both stdio and HTTP/SSE transport modes, matching the MCP specification. This means Runwall works with agents that connect via local stdio (Cursor, Claude Desktop, Cline) as well as agents that connect via remote HTTP (Claude Code, Codex, custom agents).',
    },
  ],
  faqs: [
    {
      question: 'Does Runwall require changes to my AI agent code?',
      answer: 'No. Runwall operates as a transparent MCP proxy. Your agent connects to Runwall as if it were a standard MCP server. No SDK, wrapper, or code modification is required — just point your agent\'s MCP configuration to the Runwall endpoint.',
    },
    {
      question: 'Where does Runwall sit in the agent stack?',
      answer: 'Runwall sits between the AI agent (e.g., Claude Code, Cursor, Codex) and the MCP tools the agent calls (e.g., file system, database, terminal). Every tool invocation passes through Runwall\'s governance pipeline before reaching the target tool.',
    },
    {
      question: 'Does Runwall add latency to agent tool calls?',
      answer: 'Runwall\'s policy evaluation is designed for sub-millisecond latency. The governance pipeline — identity check, policy evaluation, risk scoring, taint check — runs inline and adds minimal overhead to each tool call. Approval routing (human-in-the-loop) naturally introduces wait time, but this only triggers for actions that exceed configured risk thresholds.',
    },
    {
      question: 'Can Runwall proxy multiple MCP servers at once?',
      answer: 'Yes. Runwall\'s Tool & MCP Registry allows you to register multiple downstream MCP servers. The agent sees a unified tool list from Runwall, and Runwall routes each tool call to the correct backend MCP server based on the registry configuration.',
    },
  ],
  relatedLinks: [
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'MCP Protocol Documentation', to: '/docs/mcp' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'How Runwall Compares to API Gateways', to: '/compare/api-gateway' },
  ],
};

export default function SecurityArchitecture() {
  return <GeoPageTemplate data={data} />;
}
