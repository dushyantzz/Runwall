import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Getting Started with Runwall — AI Agent Governance Setup Guide',
  description: 'Step-by-step guide to connecting Runwall\'s execution governance layer to your AI agents via MCP. Works with Claude Code, Cursor, Codex, Cline, and any MCP-compliant agent.',
  path: '/docs/getting-started',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'Getting Started', href: 'https://runwall.in/docs/getting-started' },
  ],
  content: [
    'Runwall connects to your AI agents through the Model Context Protocol (MCP). The setup requires no changes to your agent\'s code — you simply point your agent\'s MCP configuration to the Runwall endpoint, and every tool call flows through the governance pipeline automatically. Runwall supports both stdio transport (for local agents like Cursor and Claude Desktop) and HTTP/SSE transport (for remote agents like Claude Code and Codex).',
    'Once connected, Runwall immediately begins enforcing the default governance policy: identity verification on every session, risk scoring on every tool call, and immutable audit logging of every action. You can then customize policies, configure approval workflows, and enable taint tracking based on your security requirements.',
  ],
  sections: [
    {
      heading: 'Prerequisites',
      body: 'You need a Runwall API key (available from the free tier) and an MCP-compatible AI agent. Supported agents include Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Kiro, Trae, Windsurf, Cline, Qoder, Roo Code, and any custom agent that implements the Model Context Protocol.',
    },
    {
      heading: 'What Happens After Connection',
      body: 'Once your agent connects through Runwall, every tool call passes through the governance pipeline: identity is verified, the action is evaluated against policy, a risk score is computed, taint state is checked, and the full decision context is logged. High-risk actions are routed for human approval by default. All of this happens transparently — the agent sees the same tools and responses it would without Runwall.',
    },
  ],
  codeSnippet: {
    title: 'MCP Configuration (Stdio Transport)',
    language: 'json',
    code: `{
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
      question: 'How do I connect Runwall to Cursor?',
      answer: 'Add the Runwall MCP configuration block to your Cursor MCP settings file (typically at %USERPROFILE%\\.gemini\\config\\mcp_config.json). Replace YOUR_API_KEY with your Runwall API key. Cursor will automatically route tool calls through Runwall\'s governance pipeline.',
    },
    {
      question: 'Does Runwall work with Claude Code?',
      answer: 'Yes. Claude Code supports both stdio and HTTP/SSE MCP transports. You can either add the Runwall stdio configuration to your Claude Desktop config file, or provide the direct HTTP endpoint URL (https://mcp.runwall.in/mcp) for Claude Code\'s remote MCP connection.',
    },
    {
      question: 'Do I need to modify my agent\'s code to use Runwall?',
      answer: 'No. Runwall operates as a transparent MCP proxy. Your agent connects to Runwall as if it were a standard MCP server. No SDK, wrapper, or code change is required — just update your MCP configuration to point to the Runwall endpoint.',
    },
    {
      question: 'Is there a free tier for Runwall?',
      answer: 'Yes. Runwall offers a free tier that includes basic governance features: identity verification, default policy enforcement, risk scoring, and audit logging. The free tier is suitable for individual developers and small teams exploring AI agent governance.',
    },
  ],
  relatedLinks: [
    { label: 'MCP Protocol Broker Documentation', to: '/docs/mcp' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Coding Agents Use Case', to: '/use-cases/coding-agents' },
    { label: 'Claude Code Integration', to: '/integrations/claude-code' },
  ],
};

export default function DocsGettingStarted() {
  return <GeoPageTemplate data={data} />;
}
