import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'MCP Protocol Broker & Tool Registry — Runwall Docs',
  description: 'Documentation for Runwall\'s MCP Protocol Broker and Tool/MCP Registry. How Runwall proxies the Model Context Protocol handshake and manages registered tools.',
  path: '/docs/mcp',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'MCP', href: 'https://runwall.in/docs/mcp' },
  ],
  content: [
    'Runwall\'s MCP Protocol Broker handles the full Model Context Protocol lifecycle between AI agents and downstream tool servers. It manages tool discovery, request routing, response forwarding, and error handling — all while the governance pipeline evaluates every tool call inline. The broker supports both stdio and HTTP/SSE transport modes, matching the MCP specification for maximum compatibility.',
    'The Tool & MCP Registry is the configuration layer that controls which tools are available to agents and which backend MCP servers they route to. Every tool must be explicitly registered before it becomes callable through Runwall. Unregistered tools are blocked by default, preventing unauthorized tool access and reducing the attack surface for tool poisoning.',
  ],
  sections: [
    {
      heading: 'How the Broker Works',
      body: 'When an agent connects to Runwall, the broker establishes an MCP session with the agent (acting as a server) and separate sessions with each registered downstream MCP server (acting as a client). Tool lists from all downstream servers are aggregated and presented to the agent as a unified tool catalog. When the agent calls a tool, the broker identifies the correct downstream server, forwards the request through the governance pipeline, and returns the response to the agent.',
    },
    {
      heading: 'Tool Registration',
      body: 'Tools are registered in the Runwall registry with metadata including the tool name, parameter schema, the backend MCP server it belongs to, trust level, and any tool-specific policy overrides. Registration can be done via the Runwall API or through the governance dashboard. The registry supports versioning — you can register updated tool definitions without disrupting active sessions.',
    },
  ],
  codeSnippet: {
    title: 'Tool Registry Configuration Example',
    language: 'yaml',
    code: `# runwall tool registry entry
tools:
  - name: "read_file"
    server: "filesystem-mcp"
    trust_level: "verified"
    policy_overrides:
      max_file_size_bytes: 10485760
      allowed_paths:
        - "/workspace/**"
        - "/tmp/**"
      blocked_paths:
        - "/etc/shadow"
        - "**/.env"

  - name: "execute_command"
    server: "terminal-mcp"
    trust_level: "restricted"
    requires_approval: true
    rate_limit:
      max_calls: 10
      window_seconds: 60`,
  },
  faqs: [
    {
      question: 'What is the MCP Protocol Broker in Runwall?',
      answer: 'The MCP Protocol Broker is the component that handles the Model Context Protocol communication between AI agents and the tools they call. It manages tool discovery, routes requests to the correct backend MCP server, enforces governance policies inline, and returns responses to the agent — all transparently.',
    },
    {
      question: 'Can I connect multiple MCP servers to Runwall?',
      answer: 'Yes. Runwall\'s Tool & MCP Registry supports multiple downstream MCP servers. Tools from all registered servers are aggregated into a single catalog presented to the agent. Each tool call is routed to the correct backend server based on the registry configuration.',
    },
    {
      question: 'What happens if an agent tries to call an unregistered tool?',
      answer: 'Unregistered tool calls are blocked by default. The governance pipeline returns a denied response to the agent and logs the blocked attempt in the audit trail. This prevents unauthorized tool access and mitigates tool poisoning attacks.',
    },
    {
      question: 'Does Runwall support both stdio and HTTP MCP transports?',
      answer: 'Yes. The MCP Protocol Broker supports both stdio transport (for local agents like Cursor, Claude Desktop, and Cline) and HTTP/SSE transport (for remote agents like Claude Code, Codex, and custom agents). The transport mode is configured per connection.',
    },
  ],
  relatedLinks: [
    { label: 'Getting Started Guide', to: '/docs/getting-started' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'Runwall vs. MCP Gateways', to: '/compare/mcp-gateway' },
  ],
};

export default function DocsMcp() {
  return <GeoPageTemplate data={data} />;
}
