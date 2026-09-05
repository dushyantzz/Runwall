import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Risk Scoring Engine — Runwall Docs',
  description: 'Documentation for Runwall\'s real-time Risk Scoring Engine. How risk scores are computed for every AI agent tool call based on tool type, parameters, session context, and taint state.',
  path: '/docs/risk',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'Risk Scoring', href: 'https://runwall.in/docs/risk' },
  ],
  content: [
    'Runwall\'s Risk Scoring Engine computes a real-time risk score for every agent tool call before execution. The score is derived from multiple signals: the tool type and its inherent risk classification, the specific parameters being passed, the agent\'s session history, taint state, and tenant-level risk thresholds. The resulting score determines whether the action is allowed, denied, or routed for human approval.',
    'Risk scores feed directly into the policy engine and approval workflow. A Rego policy can reference the risk score as an input attribute — for example, requiring human approval for any action scoring above 0.7, or blocking actions above 0.9 regardless of other conditions. This allows teams to express nuanced governance rules that go beyond simple allow/deny lists.',
  ],
  sections: [
    {
      heading: 'Scoring Signals',
      body: 'The risk score is computed from a weighted combination of signals: (1) Tool classification — write operations score higher than reads, terminal commands score higher than file reads. (2) Parameter analysis — destructive parameters (e.g., "DROP TABLE", "rm -rf") increase the score. (3) Session taint — tainted sessions (agent ingested untrusted input) receive a score boost. (4) Rate context — rapid successive calls from the same session increase the score. (5) Tenant thresholds — per-tenant configuration can adjust base scores for specific tools.',
    },
  ],
  codeSnippet: {
    title: 'Risk Score in Policy — Approval Threshold Example',
    language: 'rego',
    code: `package runwall.risk_policy

# Route to human approval if risk score exceeds threshold
approval_required {
    input.risk_score > 0.7
    input.risk_score <= 0.9
}

# Hard block if risk score is critical
deny[msg] {
    input.risk_score > 0.9
    msg := sprintf(
        "Blocked: risk score %.2f exceeds critical threshold "
        "for tool %s in session %s",
        [input.risk_score, input.tool_name, input.session.session_id]
    )
}`,
  },
  faqs: [
    {
      question: 'How does Runwall compute risk scores for agent actions?',
      answer: 'Risk scores are computed from a weighted combination of signals: the tool\'s inherent risk classification, the specific parameters being passed, whether the session is tainted (agent ingested untrusted input), the rate of recent tool calls, and tenant-level configuration. The resulting score ranges from 0.0 (no risk) to 1.0 (critical risk).',
    },
    {
      question: 'Can I customize risk scoring thresholds?',
      answer: 'Yes. Risk thresholds are configurable per tenant and per tool. You can adjust base risk scores for specific tools, set custom approval thresholds, and define hard-block thresholds. These configurations are applied through the policy engine and tenant management settings.',
    },
    {
      question: 'What is the difference between risk scoring and policy evaluation?',
      answer: 'Risk scoring computes a numerical risk assessment for each action. Policy evaluation makes a governance decision (allow, deny, or require approval) based on rules. The risk score is one input to the policy engine — policies can reference it alongside other attributes like identity, tool name, and taint state to make nuanced governance decisions.',
    },
  ],
  relatedLinks: [
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Taint Tracking Documentation', to: '/docs/taint' },
    { label: 'Approval Workflow Documentation', to: '/docs/approvals' },
    { label: 'Autonomous Agents Use Case', to: '/use-cases/autonomous-agents' },
  ],
};

export default function DocsRisk() {
  return <GeoPageTemplate data={data} />;
}
