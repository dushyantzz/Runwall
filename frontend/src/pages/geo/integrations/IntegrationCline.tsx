import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Cline Integration with Runwall — MCP Governance for VS Code',
  description: 'How to connect Cline (VS Code AI agent) to Runwall for execution governance. Enforce policies on file system and terminal operations through MCP.',
  path: '/integrations/cline',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Integrations', href: 'https://runwall.in/integrations/cline' },
    { name: 'Cline', href: 'https://runwall.in/integrations/cline' },
  ],
  content: [
    'Cline is an autonomous AI coding agent for VS Code that executes multi-step development tasks through MCP tool calls. Runwall integrates with Cline via the stdio MCP transport — you add the Runwall configuration to Cline\'s MCP settings file, and every tool call Cline makes (file reads, writes, terminal commands) flows through the governance pipeline automatically.',
    'Cline\'s autonomous nature makes governance particularly important: it can chain multiple tool calls without human review, reading files, modifying code, running tests, and committing changes in sequence. Runwall ensures each step is individually evaluated against policy, risk-scored, and logged — catching dangerous operations mid-workflow without disrupting safe ones.',
  ],
  codeSnippet: {
    title: 'Cline MCP Configuration',
    language: 'json',
    code: `// Add to Cline MCP settings:
// %APPDATA%/Code/User/globalStorage/
//   saoudrizwan.claude-dev/settings/
//   cline_mcp_settings.json
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
}`,
  },
  faqs: [
    {
      question: 'How do I connect Cline to Runwall?',
      answer: 'Add the Runwall MCP configuration to Cline\'s settings file (typically at %APPDATA%/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json). Replace YOUR_API_KEY with your Runwall API key. Cline will route all MCP tool calls through Runwall automatically.',
    },
    {
      question: 'Does Runwall affect Cline\'s autonomous workflow?',
      answer: 'Runwall is transparent for safe operations — file reads, safe terminal commands, and standard development operations proceed without delay. Only actions that exceed risk thresholds or match policy rules are paused for approval or blocked. Cline\'s multi-step autonomous workflow continues uninterrupted for safe actions.',
    },
    {
      question: 'Can Runwall govern Cline\'s terminal command execution?',
      answer: 'Yes. Every terminal command Cline executes through MCP is intercepted by Runwall, risk-scored based on the command content and session context, and evaluated against policy. Destructive commands can be blocked or require human approval before execution.',
    },
  ],
  relatedLinks: [
    { label: 'Getting Started Guide', to: '/docs/getting-started' },
    { label: 'Cursor Integration', to: '/integrations/cursor' },
    { label: 'Claude Code Integration', to: '/integrations/claude-code' },
    { label: 'Coding Agents Use Case', to: '/use-cases/coding-agents' },
  ],
};

export default function IntegrationCline() {
  return <GeoPageTemplate data={data} />;
}
