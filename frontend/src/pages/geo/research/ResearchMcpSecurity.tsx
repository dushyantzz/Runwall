import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'MCP Security — Securing the Model Context Protocol | Runwall Research',
  description: 'Research on securing the Model Context Protocol (MCP) — the protocol AI agents use to call tools. Threat vectors, governance approaches, and how Runwall addresses MCP-specific security risks.',
  path: '/research/mcp-security',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Research', href: 'https://runwall.in/research/mcp-security' },
    { name: 'MCP Security', href: 'https://runwall.in/research/mcp-security' },
  ],
  content: [
    'The Model Context Protocol (MCP) is becoming the standard interface for AI agents to discover and invoke tools — file systems, databases, APIs, terminal sessions, and custom services. As MCP adoption grows, so does the attack surface: every MCP server is a potential entry point for prompt injection, tool poisoning, data exfiltration, and privilege escalation. Securing MCP requires governance at the protocol level, not just at the application or network layer.',
    'MCP-specific security concerns include: unauthenticated tool discovery (an agent can discover tools without verifying the server\'s identity), unrestricted parameter passing (an agent can pass arbitrary parameters to any discovered tool), lack of built-in policy enforcement (MCP delegates all authorization to the tool implementation), and no session-level context tracking (MCP does not track data flow across tool calls within a session).',
  ],
  sections: [
    {
      heading: 'MCP\'s Security Model — What\'s Missing',
      body: 'MCP by design is a protocol for tool communication, not a security framework. It provides the structure for agents to discover tools, invoke them, and receive responses. But it does not specify how to authenticate agents, how to authorize individual tool calls, how to track data flow across calls, or how to handle high-risk actions. These gaps are not bugs — they are by design, because MCP is meant to be protocol-agnostic about governance. The governance layer must be added externally — which is what Runwall provides.',
    },
    {
      heading: 'Runwall\'s Approach to MCP Security',
      body: 'Runwall sits as an inline proxy in the MCP communication path. It adds identity verification at session establishment, policy evaluation at every tool call, risk scoring based on the tool type and parameters, session-level taint tracking for data flow governance, and approval workflows for high-risk actions. These mechanisms are applied transparently to all MCP traffic passing through Runwall, without requiring changes to the MCP protocol itself or to the agent or tool implementations.',
    },
  ],
  faqs: [
    {
      question: 'Is the Model Context Protocol secure?',
      answer: 'MCP is a communication protocol, not a security framework. It provides the structure for agents to call tools, but does not include built-in authentication, authorization, policy enforcement, or data flow tracking. Securing MCP requires an external governance layer — like Runwall — that adds these capabilities at the protocol level.',
    },
    {
      question: 'What are the main security risks with MCP?',
      answer: 'The main MCP security risks include: unauthenticated tool discovery, unrestricted parameter passing, lack of per-call authorization, no data flow tracking across sessions, and vulnerability to tool poisoning (malicious tool definitions). Runwall addresses each of these through identity verification, policy enforcement, risk scoring, taint tracking, and tool registry validation.',
    },
    {
      question: 'Do I need to modify MCP to make it secure?',
      answer: 'No. Runwall adds security as an inline proxy layer without modifying the MCP protocol. Agents and tools continue to use standard MCP — Runwall intercepts and governs the traffic between them transparently.',
    },
  ],
  relatedLinks: [
    { label: 'MCP Protocol Documentation', to: '/docs/mcp' },
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'MCP Gateway (Pillar)', to: '/mcp-gateway' },
    { label: 'Runwall vs. MCP Gateways', to: '/compare/mcp-gateway' },
  ],
};

export default function ResearchMcpSecurity() {
  return <GeoPageTemplate data={data} />;
}
