import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Cursor Integration with Runwall — MCP Governance for Cursor AI',
  description: 'How to connect Cursor\'s AI agent to Runwall for execution governance. Enforce file system and terminal policies on Cursor\'s MCP tool calls.',
  path: '/integrations/cursor',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Integrations', href: 'https://runwall.in/integrations/cursor' },
    { name: 'Cursor', href: 'https://runwall.in/integrations/cursor' },
  ],
  content: [
    'Cursor is an AI-powered code editor whose built-in agent can read and write files, execute terminal commands, and interact with development tools through MCP. Runwall integrates with Cursor via the stdio MCP transport — you add the Runwall configuration to Cursor\'s MCP settings file, and every tool call Cursor\'s agent makes flows through the governance pipeline.',
    'With Runwall governing Cursor, file operations are validated against path-based policies (preventing access to sensitive files like .env or credentials), terminal commands are risk-scored with destructive commands requiring approval, and the full session is logged in the audit trail for forensic analysis.',
  ],
  codeSnippet: {
    title: 'Cursor MCP Configuration',
    language: 'json',
    code: `// Add to Cursor MCP settings
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
      question: 'How do I add Runwall to Cursor?',
      answer: 'Add the Runwall MCP configuration block to Cursor\'s MCP settings file. Replace YOUR_API_KEY with your Runwall API key. Cursor\'s AI agent will automatically route all tool calls through Runwall\'s governance pipeline.',
    },
    {
      question: 'Does Runwall work with Cursor\'s AI features?',
      answer: 'Yes. Runwall governs the tool-calling layer (file operations, terminal commands) without affecting Cursor\'s code generation, autocomplete, or chat features. Only actions that interact with the file system or terminal through MCP are evaluated by Runwall.',
    },
    {
      question: 'Can I prevent Cursor from reading sensitive files?',
      answer: 'Yes. Runwall\'s policy engine supports path-based rules that can block file reads on specific paths (e.g., .env files, credential stores, system configuration). Unauthorized file access attempts are denied and logged.',
    },
  ],
  relatedLinks: [
    { label: 'Getting Started Guide', to: '/docs/getting-started' },
    { label: 'Claude Code Integration', to: '/integrations/claude-code' },
    { label: 'Cline Integration', to: '/integrations/cline' },
    { label: 'Coding Agents Use Case', to: '/use-cases/coding-agents' },
  ],
};

export default function IntegrationCursor() {
  return <GeoPageTemplate data={data} />;
}
