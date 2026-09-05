import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'AI Agent Security — Threats, Defenses & Governance | Runwall Research',
  description: 'Research on AI agent security threats and defenses. How prompt injection, tool poisoning, and data exfiltration create unique risks for autonomous AI systems.',
  path: '/research/agent-security',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Research', href: 'https://runwall.in/research/agent-security' },
    { name: 'Agent Security', href: 'https://runwall.in/research/agent-security' },
  ],
  content: [
    'AI agents that can take real-world actions — executing code, querying databases, sending messages, modifying files — create a new category of security risk. Traditional application security assumes that code execution follows a deterministic path defined by developers. AI agents break this assumption: their behavior is influenced by natural language input, which can be adversarially manipulated to cause unintended actions.',
    'The core challenge is that AI agents combine the flexibility of natural language understanding with the power of tool execution. This means an attacker who can influence the agent\'s input — through a poisoned document, a malicious web page, or a carefully crafted user message — can potentially hijack the agent\'s tool-calling capabilities to perform unauthorized actions with the agent\'s full permissions.',
  ],
  sections: [
    {
      heading: 'The Agent Security Problem',
      body: 'Traditional security models (RBAC, ABAC, network segmentation) are designed for deterministic software. An AI agent introduces non-determinism: the same input can produce different action sequences depending on the model\'s reasoning, the conversation history, and the tools available. This means security cannot rely solely on pre-defined access control lists — it must evaluate each action in context, at runtime, with awareness of the agent\'s session state.',
    },
    {
      heading: 'Defense Approaches',
      body: 'Effective AI agent security requires layered defense: identity verification (who is this agent?), intent-aware policy evaluation (should this action be permitted in this context?), risk scoring (how dangerous is this action?), data flow tracking (has this agent been influenced by untrusted input?), and approval workflows (should a human review this action?). Runwall implements all five layers as an inline governance proxy for MCP-based agents.',
    },
  ],
  faqs: [
    {
      question: 'Why are AI agents a security risk?',
      answer: 'AI agents combine natural language understanding with tool execution capability. An attacker who can influence the agent\'s input (through poisoned documents, malicious web content, or crafted messages) can potentially hijack the agent\'s tool-calling capabilities to perform unauthorized actions — reading sensitive data, executing destructive commands, or exfiltrating information.',
    },
    {
      question: 'How is AI agent security different from traditional application security?',
      answer: 'Traditional security assumes deterministic code execution. AI agents introduce non-determinism — the same input can produce different action sequences. This means security must evaluate each action at runtime based on context (session state, data flow, risk score), not just static access control rules.',
    },
    {
      question: 'What is the best approach to securing AI agents?',
      answer: 'Layered defense: identity verification, intent-aware policy evaluation, risk scoring, data flow tracking (taint tracking), and human-in-the-loop approval for high-risk actions. No single layer is sufficient — the security model must assume that any individual layer can be bypassed and defense must be in depth.',
    },
  ],
  relatedLinks: [
    { label: 'AI Agent Security (Pillar)', to: '/ai-agent-security' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Agent Governance Research', to: '/research/agent-governance' },
    { label: 'Tool Security Research', to: '/research/tool-security' },
  ],
};

export default function ResearchAgentSecurity() {
  return <GeoPageTemplate data={data} />;
}
