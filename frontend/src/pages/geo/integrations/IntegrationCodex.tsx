import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'OpenAI Codex Integration with Runwall — MCP Governance',
  description: 'How to connect OpenAI Codex to Runwall for execution governance via MCP. Enforce policies, risk scoring, and audit logging on Codex agent tool calls.',
  path: '/integrations/codex',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Integrations', href: 'https://runwall.in/integrations/codex' },
    { name: 'Codex', href: 'https://runwall.in/integrations/codex' },
  ],
  content: [
    'OpenAI Codex is an autonomous coding agent that can execute multi-step development tasks including reading code, running tests, installing dependencies, and deploying changes. When connected through MCP, Codex\'s tool calls can be governed by Runwall — ensuring that every file operation, terminal command, and API call is evaluated against policy before execution.',
    'Codex connects to Runwall via the HTTP/SSE transport endpoint. Once configured, Codex\'s autonomous workflow operates normally for safe actions while high-risk operations are caught by Runwall\'s governance pipeline — risk-scored, evaluated against policy, and routed for approval when necessary.',
  ],
  codeSnippet: {
    title: 'Codex MCP Connection',
    language: 'text',
    code: `# Codex HTTP/SSE MCP endpoint
https://mcp.runwall.in/mcp

# Configure with your Runwall API key in the Codex
# MCP settings panel or environment configuration.
# All tool calls will route through Runwall's governance
# pipeline automatically.`,
  },
  faqs: [
    {
      question: 'Does Runwall work with OpenAI Codex?',
      answer: 'Yes. Codex connects to Runwall via the HTTP/SSE MCP endpoint. Once connected, all of Codex\'s tool calls — file operations, terminal commands, API requests — are governed by Runwall\'s policy engine, risk scoring, and audit logging.',
    },
    {
      question: 'Can Runwall govern Codex\'s autonomous multi-step workflows?',
      answer: 'Yes. Runwall evaluates each tool call independently as it occurs. In a multi-step Codex workflow, every step passes through the governance pipeline. If any step triggers a policy violation or exceeds a risk threshold, that specific action is caught — without disrupting the rest of the workflow.',
    },
    {
      question: 'How do I set up Codex with Runwall?',
      answer: 'Configure Codex to connect to the Runwall MCP endpoint (https://mcp.runwall.in/mcp) using HTTP/SSE transport. Provide your Runwall API key in the connection configuration. Codex will then route all MCP tool calls through Runwall\'s governance pipeline.',
    },
  ],
  relatedLinks: [
    { label: 'Getting Started Guide', to: '/docs/getting-started' },
    { label: 'Claude Code Integration', to: '/integrations/claude-code' },
    { label: 'Autonomous Agents Use Case', to: '/use-cases/autonomous-agents' },
    { label: 'Custom Agents Integration', to: '/integrations/custom-agents' },
  ],
};

export default function IntegrationCodex() {
  return <GeoPageTemplate data={data} />;
}
