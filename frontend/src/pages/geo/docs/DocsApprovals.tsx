import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Approval Workflow Engine — Runwall Docs',
  description: 'Documentation for Runwall\'s Approval Workflow Engine. Configure human-in-the-loop approval, log-and-allow, or hard block modes for AI agent tool calls.',
  path: '/docs/approvals',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'Approvals', href: 'https://runwall.in/docs/approvals' },
  ],
  content: [
    'Runwall\'s Approval Workflow Engine provides three configurable modes for handling tool calls that fall into the governance gray zone — actions that aren\'t clearly safe to allow or dangerous enough to block outright. The default mode asks a human approver to review and authorize the action before it executes. Two alternative modes support different operational needs: log-and-allow for simulation environments, and hard block for maximum restriction.',
    'Approval workflows are triggered by policy rules and risk score thresholds. When a tool call matches an approval-required condition (e.g., risk score between 0.7 and 0.9, or a tainted session attempting a write), the action is paused and a pending approval is created. The approval contains the full decision context: tool name, parameters, risk score, policy evaluation result, taint state, and agent identity.',
  ],
  sections: [
    {
      heading: 'Three Approval Modes',
      body: 'Ask Human (default): The tool call is paused and routed to a human approver. The approver sees the full context and can approve or reject with a logged justification. Log & Allow: The tool call is allowed to proceed, but the approval event is logged as if it had been flagged. This mode is useful for simulation, dry-run, and initial deployment phases where you want to see what would be flagged without blocking operations. Hard Block: The tool call is denied immediately with no option for approval. This mode is for actions that should never be permitted regardless of context.',
    },
  ],
  codeSnippet: {
    title: 'Approval Mode Configuration',
    language: 'yaml',
    code: `# Runwall approval workflow configuration
approval_workflows:
  # Default: ask a human for gray-zone actions
  default_mode: "ask_human"

  rules:
    - name: "high_risk_terminal"
      condition:
        tool_name: "execute_command"
        risk_score_above: 0.7
      mode: "ask_human"
      approvers: ["security-team"]
      timeout_seconds: 300

    - name: "tainted_writes"
      condition:
        taint_state: "tainted"
        action_type: "write"
      mode: "hard_block"

    - name: "staging_simulation"
      condition:
        tenant: "staging"
      mode: "log_and_allow"`,
  },
  faqs: [
    {
      question: 'What are the approval modes in Runwall?',
      answer: 'Runwall has three approval modes: "Ask Human" (default) pauses the action and routes it for human review; "Log & Allow" lets the action proceed but logs it as flagged (useful for simulation); "Hard Block" denies the action immediately with no approval option.',
    },
    {
      question: 'How does human-in-the-loop approval work?',
      answer: 'When a tool call triggers an approval condition (based on risk score, policy rules, or taint state), the action is paused and a pending approval is created with full context. A human approver reviews the details and can approve or reject the action with a logged justification. The action only executes upon explicit approval.',
    },
    {
      question: 'Can I use log-and-allow mode to test approval rules before enforcing them?',
      answer: 'Yes. Log-and-allow mode is specifically designed for this. It evaluates the same conditions as ask-human mode but allows the action to proceed while logging the approval event. This lets you see which actions would be flagged without disrupting operations — similar to a dry-run for approval workflows.',
    },
    {
      question: 'What happens if an approval times out?',
      answer: 'Approval timeouts are configurable per rule. When a pending approval exceeds its timeout, the default behavior is to deny the action (fail-closed). You can configure alternative timeout behaviors per workflow, such as escalation to a different approver.',
    },
  ],
  relatedLinks: [
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Risk Scoring Documentation', to: '/docs/risk' },
    { label: 'Audit Log Documentation', to: '/docs/audit' },
    { label: 'Enterprise MCP Use Case', to: '/use-cases/enterprise-mcp' },
  ],
};

export default function DocsApprovals() {
  return <GeoPageTemplate data={data} />;
}
