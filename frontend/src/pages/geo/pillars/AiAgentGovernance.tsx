import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'AI Agent Governance — Policy Enforcement, Approvals & Audit for AI Agents | Runwall',
  description: 'How to implement governance for AI agents with OPA/Rego policy enforcement, human-in-the-loop approval workflows, and immutable audit trails. Runwall\'s compliance-focused governance platform.',
  path: '/ai-agent-governance',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'AI Agent Governance', href: 'https://runwall.in/ai-agent-governance' },
  ],
  content: [
    'AI agent governance is the discipline of controlling what autonomous AI systems are allowed to do, how high-risk actions are reviewed, and how all actions are recorded for compliance and forensics. As organizations move AI agents from prototypes to production — deploying them for code generation, customer interactions, data processing, and infrastructure management — governance becomes the difference between responsible deployment and organizational risk.',
    'Runwall implements AI agent governance through three pillars: declarative policy enforcement using OPA/Rego (what agents can do), configurable approval workflows with human-in-the-loop gates (how high-risk actions are reviewed), and immutable audit logging with evidence replay (what agents did and why). This governance model is applied to every agent tool call through the MCP protocol, without requiring changes to agent code.',
  ],
  sections: [
    {
      heading: 'Policy Enforcement',
      body: 'Runwall\'s Policy Engine evaluates every agent action against OPA/Rego policies — declarative rules that define what is allowed, denied, or requires approval based on the agent\'s identity, the tool being called, the parameters, the risk score, the taint state, and the tenant context. Policies are versioned, testable, and hot-reloadable. The policy engine uses a fail-closed model: if evaluation fails, the default action is deny.',
    },
    {
      heading: 'Approval Workflows',
      body: 'For actions that fall in the gray zone — not clearly safe enough to auto-allow, not clearly dangerous enough to auto-deny — Runwall provides configurable approval workflows. The default mode pauses the action and routes it to a human approver with full context. Alternative modes include log-and-allow (for simulation) and hard block (for maximum restriction).',
    },
    {
      heading: 'Audit & Compliance',
      body: 'Every governance decision is recorded in an immutable, append-only audit log with the complete decision context: tool call details, identity, risk score, taint state, policy version, evaluation result, and approval outcome. Evidence Replay reconstructs full agent sessions as chronological timelines for incident investigation and compliance reporting.',
    },
  ],
  faqs: [
    {
      question: 'What is AI agent governance?',
      answer: 'AI agent governance encompasses the policies, workflows, and audit mechanisms that control autonomous AI agent behavior. It includes declarative policy enforcement (what agents can do), approval workflows (how high-risk actions are reviewed), and audit logging (recording what agents did for compliance and forensics).',
    },
    {
      question: 'How does Runwall enforce governance policies on AI agents?',
      answer: 'Runwall evaluates every agent tool call against OPA/Rego policies before execution. Policies define allow/deny/approval-required rules based on agent identity, tool name, parameters, risk score, taint state, and tenant context. The policy engine uses a fail-closed model — if evaluation fails, the action is denied.',
    },
    {
      question: 'Does Runwall support compliance auditing?',
      answer: 'Yes. Runwall\'s immutable audit log records every governance decision with complete context. Evidence Replay can reconstruct agent sessions as chronological timelines. This provides the audit trail needed for compliance reporting, incident investigation, and regulatory demonstration of AI governance.',
    },
    {
      question: 'Can governance rules be updated without restarting agents?',
      answer: 'Yes. Runwall\'s policies are hot-reloadable — you can deploy, test, and activate new Rego policies without restarting the governance gateway or disconnecting agents. Changes propagate in seconds.',
    },
  ],
  relatedLinks: [
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Approval Workflow Documentation', to: '/docs/approvals' },
    { label: 'Audit Log Documentation', to: '/docs/audit' },
    { label: 'AI Agent Security', to: '/ai-agent-security' },
    { label: 'Agent Governance Research', to: '/research/agent-governance' },
    { label: 'Enterprise MCP Use Case', to: '/use-cases/enterprise-mcp' },
  ],
};

export default function AiAgentGovernance() {
  return <GeoPageTemplate data={data} />;
}
