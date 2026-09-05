import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'AI Agent Security — Protect AI Agents from Prompt Injection, Tool Poisoning & Data Exfiltration | Runwall',
  description: 'Comprehensive guide to AI agent security threats and defenses. How Runwall protects agents from prompt injection, tool poisoning, runaway loops, and data exfiltration through zero-trust execution governance.',
  path: '/ai-agent-security',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'AI Agent Security', href: 'https://runwall.in/ai-agent-security' },
  ],
  content: [
    'AI agents that can execute real-world actions — writing code, running terminal commands, querying databases, calling APIs — are fundamentally different from chat-only AI systems. They don\'t just generate text; they take actions with real consequences. This makes them high-value targets for adversarial attacks: prompt injection that hijacks agent behavior, tool poisoning that exfiltrates data through malicious tool definitions, data exfiltration across multi-step workflows, and runaway loops that drain resources.',
    'Securing AI agents requires a new category of defense — execution governance — that evaluates every agent action in context before it executes. Runwall provides this as a zero-trust governance layer for MCP-based agents: every tool call is verified against identity, evaluated against policy, scored for risk, checked for data taint, and logged immutably. No action is trusted by default.',
  ],
  sections: [
    {
      heading: 'Prompt Injection Defense',
      body: 'Prompt injection is the most discussed threat to AI agents: adversarial instructions hidden in data the agent processes (web pages, files, messages) that attempt to hijack the agent\'s behavior. Runwall defends against prompt injection through session-level taint tracking — when an agent ingests untrusted input, the session is flagged and downstream destructive actions are restricted, even if the injected content is paraphrased or reformulated by the agent.',
    },
    {
      heading: 'Tool Poisoning Prevention',
      body: 'Tool poisoning exploits the trust between agents and their tools: a malicious tool definition can trick the agent into including sensitive data in parameters, or a tool can perform operations beyond what its name suggests. Runwall\'s Tool & MCP Registry requires explicit tool registration and trust verification. Unregistered tools are blocked, and registered tools can have parameter-level validation rules.',
    },
    {
      heading: 'Data Exfiltration Control',
      body: 'AI agents naturally move data between tools as part of their workflow. Taint tracking ensures that when sensitive data enters an agent\'s session, all downstream write operations are governed — preventing the agent from forwarding, summarizing, or redistributing sensitive information to unauthorized destinations.',
    },
    {
      heading: 'Runaway Loop Protection',
      body: 'Autonomous agents can enter infinite loops through logic errors or adversarial prompting, executing thousands of tool calls and draining resources. Runwall enforces per-agent, per-tool rate limits and budget quotas that hard-block further calls when limits are exceeded.',
    },
  ],
  faqs: [
    {
      question: 'How do I secure my AI agent?',
      answer: 'Use an execution governance layer like Runwall that sits between your agent and its tools. Every tool call should be verified against policy, risk-scored, checked for data taint, and logged. Key defenses include taint tracking for prompt injection, a verified tool registry for tool poisoning, rate limits for runaway loops, and approval workflows for high-risk actions.',
    },
    {
      question: 'What is the biggest security risk with AI agents?',
      answer: 'Prompt injection is the most broadly applicable threat — adversarial instructions in data the agent processes can hijack its behavior. But the full threat model also includes tool poisoning, data exfiltration through multi-step workflows, and runaway loops. Effective security requires defense against all four vectors.',
    },
    {
      question: 'Can I use Runwall to secure agents I didn\'t build?',
      answer: 'Yes. Runwall operates as a transparent MCP proxy. Any MCP-compatible agent — Claude Code, Codex, Cursor, Cline, or custom agents — can be governed by Runwall without code modifications. You simply point the agent\'s MCP configuration to the Runwall endpoint.',
    },
    {
      question: 'Is zero-trust necessary for AI agents?',
      answer: 'Yes. AI agents are non-deterministic — the same input can produce different action sequences. This means you cannot pre-certify an agent as safe; you must evaluate each action at runtime. Zero-trust execution governance (verifying every action, trusting none by default) is the appropriate security model for autonomous AI systems.',
    },
  ],
  relatedLinks: [
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Taint Tracking Documentation', to: '/docs/taint' },
    { label: 'Agent Security Research', to: '/research/agent-security' },
    { label: 'AI Agent Firewall', to: '/ai-agent-firewall' },
    { label: 'Coding Agents Use Case', to: '/use-cases/coding-agents' },
    { label: 'Getting Started', to: '/docs/getting-started' },
  ],
};

export default function AiAgentSecurity() {
  return <GeoPageTemplate data={data} />;
}
