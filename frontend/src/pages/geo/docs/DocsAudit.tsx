import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Audit Log & Evidence Replay — Runwall Docs',
  description: 'Documentation for Runwall\'s immutable Audit Log and Evidence Replay system. Every agent action is logged with full decision context for forensic analysis and compliance.',
  path: '/docs/audit',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'Audit', href: 'https://runwall.in/docs/audit' },
  ],
  content: [
    'Runwall\'s Audit Log records every agent action that passes through the governance pipeline — allowed, denied, or approval-routed. Each log entry includes the complete decision context: tool name, parameters, agent identity, tenant, session ID, taint state, risk score, policy version used, evaluation result, and timestamp. The log is append-only and immutable — entries cannot be modified or deleted after creation.',
    'Evidence Replay allows you to reconstruct the exact sequence of actions an agent performed in a session, including the governance decisions made at each step. This is critical for incident investigation, compliance audits, and understanding how an agent arrived at a particular outcome. Replay shows not just what the agent did, but why each action was allowed or denied based on the policy and risk state at that moment.',
  ],
  sections: [
    {
      heading: 'What Gets Logged',
      body: 'Every governance decision is logged with: the tool call request (tool name, parameters, invocation context), the identity of the calling agent and its session, the taint state at the time of the call, the computed risk score, the policy version that was evaluated, the policy evaluation result (allow/deny/approval-required) with the specific rule that matched, the approval outcome (if applicable), the execution result from the downstream tool, and the complete timestamp chain.',
    },
    {
      heading: 'Evidence Replay',
      body: 'Evidence Replay reconstructs an agent session as a chronological timeline of actions and governance decisions. For each step, you can see the input (what the agent requested), the governance context (risk score, taint state, policy evaluation), the decision (allow/deny/approval), and the output (tool response). This enables forensic analysis of incidents — such as understanding how a data leak occurred or why a destructive action was permitted.',
    },
  ],
  codeSnippet: {
    title: 'Audit Log Query Example',
    language: 'json',
    code: `// GET /api/audit-logs?session_id=sess_abc123&limit=5
{
  "logs": [
    {
      "timestamp": "2025-09-01T14:23:01Z",
      "session_id": "sess_abc123",
      "agent_identity": "claude-code@user-42",
      "tool_name": "read_file",
      "parameters": { "path": "/workspace/config.yaml" },
      "risk_score": 0.12,
      "taint_state": "clean",
      "policy_version": "v2.3.1",
      "decision": "allow",
      "matched_rule": "default_allow_reads"
    },
    {
      "timestamp": "2025-09-01T14:23:04Z",
      "tool_name": "execute_command",
      "parameters": { "command": "npm install" },
      "risk_score": 0.65,
      "taint_state": "clean",
      "policy_version": "v2.3.1",
      "decision": "allow",
      "matched_rule": "allow_package_managers"
    }
  ]
}`,
  },
  faqs: [
    {
      question: 'Is the Runwall audit log tamper-proof?',
      answer: 'The audit log is append-only and immutable. Once an entry is written, it cannot be modified or deleted. This ensures the integrity of the audit trail for compliance and forensic purposes.',
    },
    {
      question: 'What is evidence replay in Runwall?',
      answer: 'Evidence replay reconstructs the exact sequence of actions an agent performed in a session, including the governance decision at each step. It shows what the agent requested, the risk score and taint state at that moment, which policy rule matched, and the outcome — enabling forensic analysis of incidents.',
    },
    {
      question: 'Can I query audit logs by agent, tool, or time range?',
      answer: 'Yes. Audit logs can be queried by session ID, agent identity, tool name, decision outcome (allow/deny/approval), risk score range, taint state, and time range. This supports both targeted incident investigation and broad compliance reporting.',
    },
    {
      question: 'How long are audit logs retained?',
      answer: 'Audit log retention is configurable per tenant. The default retention period ensures logs are available for compliance and forensic analysis. Retention policies can be adjusted based on your organization\'s requirements.',
    },
  ],
  relatedLinks: [
    { label: 'Approval Workflow Documentation', to: '/docs/approvals' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Security Testing Case Study', to: '/security/testing' },
    { label: 'AI Agent Governance (Pillar)', to: '/ai-agent-governance' },
  ],
};

export default function DocsAudit() {
  return <GeoPageTemplate data={data} />;
}
