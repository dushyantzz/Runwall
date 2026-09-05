import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Claude Code Integration with Runwall — MCP Governance Setup',
  description: 'How to connect Claude Code to Runwall for execution governance. Step-by-step setup for both stdio and HTTP/SSE MCP transport with policy enforcement.',
  path: '/integrations/claude-code',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Integrations', href: 'https://runwall.in/integrations/claude-code' },
    { name: 'Claude Code', href: 'https://runwall.in/integrations/claude-code' },
  ],
  content: [
    'Claude Code is Anthropic\'s agentic coding assistant that can read and write files, execute terminal commands, search codebases, and interact with development tools through MCP. Runwall integrates with Claude Code as a transparent MCP proxy — Claude Code connects to Runwall as if it were a standard MCP server, and every tool call flows through the governance pipeline before reaching the target tools.',
    'Claude Code supports both stdio transport (via the @runwall/mcp npm package) and HTTP/SSE transport (via the direct Runwall endpoint URL). The stdio method is recommended for Claude Desktop, while the HTTP/SSE method works with Claude Code\'s remote MCP connection feature. Both methods provide identical governance coverage.',
  ],
  codeSnippet: {
    title: 'Claude Code — Stdio Configuration (Claude Desktop)',
    language: 'json',
    code: `// Add to: %APPDATA%/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "runwall": {
      "command": "npx",
      "args": ["-y", "@runwall/mcp"],
      "env": {
        "RUNWALL_API_KEY": "YOUR_API_KEY",
        "RUNWALL_URL": "https://mcp.runwall.in/mcp"
      }
    }
  }
}

// Alternative: HTTP/SSE direct URL for Claude Code
// https://mcp.runwall.in/mcp`,
  },
  faqs: [
    {
      question: 'How do I connect Claude Code to Runwall?',
      answer: 'Add the Runwall MCP configuration to your Claude Desktop config file (typically at %APPDATA%/Claude/claude_desktop_config.json) with your Runwall API key. Alternatively, use the HTTP/SSE endpoint URL (https://mcp.runwall.in/mcp) for Claude Code\'s remote MCP connection. Both methods route all tool calls through Runwall\'s governance pipeline.',
    },
    {
      question: 'Does Runwall change how Claude Code works?',
      answer: 'No. Claude Code sees the same tools and receives the same responses — Runwall is transparent. The only visible change is that high-risk actions (as defined by your policies) may be paused for approval or blocked, and all actions are logged in the audit trail.',
    },
    {
      question: 'Can Runwall prevent Claude Code from executing dangerous terminal commands?',
      answer: 'Yes. Every terminal command Claude Code attempts is risk-scored by Runwall. Destructive commands, privilege escalation, and network operations to untrusted endpoints can be configured to require approval or be blocked outright. Safe commands proceed without delay.',
    },
  ],
  relatedLinks: [
    { label: 'Getting Started Guide', to: '/docs/getting-started' },
    { label: 'Coding Agents Use Case', to: '/use-cases/coding-agents' },
    { label: 'Cline Integration', to: '/integrations/cline' },
    { label: 'Codex Integration', to: '/integrations/codex' },
  ],
};

export default function IntegrationClaudeCode() {
  return <GeoPageTemplate data={data} />;
}
