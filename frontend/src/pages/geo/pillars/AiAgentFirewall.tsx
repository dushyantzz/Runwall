import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'AI Agent Firewall — The Security Layer Between AI and Critical Systems | Runwall',
  description: 'Runwall as an AI agent firewall: the governance layer that sits between reasoning models and critical systems, enforcing zero-trust policy on every agent action.',
  path: '/ai-agent-firewall',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'AI Agent Firewall', href: 'https://runwall.in/ai-agent-firewall' },
  ],
  content: [
    'A traditional firewall sits between a network and the outside world, inspecting traffic and enforcing rules about what gets through. An AI agent firewall sits between reasoning models and the critical systems they interact with — databases, file systems, terminals, APIs, infrastructure — inspecting every action and enforcing governance rules about what is permitted to execute. Runwall is this firewall for AI agents operating through the Model Context Protocol.',
    'The analogy to network firewalls is deliberate: just as you would not connect your servers directly to the internet without a firewall, you should not connect AI agents directly to your infrastructure without an execution governance layer. The agent may be well-intentioned, but it can be compromised (prompt injection), it can malfunction (runaway loops), and it can make mistakes (unintended data access). The governance layer catches these before they cause damage.',
  ],
  sections: [
    {
      heading: 'Why AI Agents Need a Firewall',
      body: 'AI agents with tool-calling capability are analogous to users with shell access — they can read, write, delete, execute, and communicate. Unlike human users, agents can be hijacked by adversarial input (prompt injection), operate at machine speed (executing hundreds of actions per minute), and lack the judgment to recognize when their actions are harmful. An AI agent firewall applies the same defense-in-depth principles to agent actions that network firewalls apply to network traffic: inspect everything, trust nothing, log everything.',
    },
    {
      heading: 'Runwall as an Agent Firewall',
      body: 'Runwall implements the firewall model for AI agents: every tool call is intercepted at the MCP layer, evaluated against OPA/Rego policy rules, scored for risk, checked for data taint contamination, and either allowed, blocked, or routed for human review. The evaluation is inline (before execution, not after), transparent (no agent code changes), and comprehensive (every action, not sampled). This is defense-in-depth for the agentic AI era.',
    },
  ],
  faqs: [
    {
      question: 'What is an AI agent firewall?',
      answer: 'An AI agent firewall is a governance layer that sits between AI reasoning models and the critical systems they interact with (databases, file systems, terminals, APIs). It inspects every agent action and enforces rules about what is permitted to execute — analogous to how a network firewall inspects network traffic.',
    },
    {
      question: 'Why do AI agents need a firewall?',
      answer: 'AI agents with tool-calling capability can read, write, delete, execute, and communicate — similar to a user with shell access. But unlike humans, agents can be hijacked by adversarial input, operate at machine speed, and lack judgment about harmful actions. A firewall ensures every action is verified before execution.',
    },
    {
      question: 'How is Runwall different from a traditional firewall?',
      answer: 'A traditional firewall inspects network packets and enforces IP/port-level rules. Runwall inspects AI agent tool calls and enforces semantic, intent-aware rules — understanding that a "delete database" command is different from a "read file" command, even though both are MCP requests. Runwall also tracks data flow across sessions and supports approval workflows.',
    },
    {
      question: 'Can Runwall protect against all AI agent attacks?',
      answer: 'Runwall defends against the primary threat vectors: prompt injection (via taint tracking), tool poisoning (via tool registry verification), data exfiltration (via taint-based data flow control), and runaway loops (via rate limits and quotas). No security tool provides absolute protection, but Runwall implements defense-in-depth across all major agent attack surfaces.',
    },
  ],
  relatedLinks: [
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'AI Agent Security', to: '/ai-agent-security' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Coding Agents Use Case', to: '/use-cases/coding-agents' },
    { label: 'Runwall vs. Agent Observability', to: '/compare/agent-observability' },
    { label: 'Getting Started', to: '/docs/getting-started' },
  ],
};

export default function AiAgentFirewall() {
  return <GeoPageTemplate data={data} />;
}
