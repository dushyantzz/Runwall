import { GitBranch, Users, Clock, Bell, Shield, Layers, CheckCircle, Settings, FileText } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: GitBranch,
  title: 'Approval Workflow Engine',
  subtitle: 'Human-in-the-loop gates with configurable escalation chains, SLA timers, and multi-party approval for high-risk agent actions — ensuring humans stay in control.',
  badgeText: 'Human-in-the-Loop',

  problem: {
    heading: 'No mechanism for human oversight of agent actions',
    description: 'Autonomous agents make thousands of decisions without any human checkpoint. When an action is too risky for automatic approval, there is no workflow to route it for human review.',
    points: [
      'High-risk agent actions execute without human review',
      'No escalation path when automated checks are insufficient',
      'Approval requests are lost in email or chat with no tracking',
      'No SLA enforcement — approvals wait indefinitely',
      'Cannot require multi-party approval for critical operations',
    ],
  },

  whatItDoes: {
    heading: 'Structured approval workflows for agent governance',
    description: 'Runwall\'s Approval Workflow Engine routes high-risk agent actions to designated reviewers with configurable escalation chains, SLA timers, and multi-party approval requirements.',
    points: [
      'Configurable approval routing rules',
      'Multi-party and quorum-based approval',
      'SLA timers with automatic escalation',
      'Approval delegation and delegation chains',
      'Rich context presentation for reviewers',
      'Mobile and Slack/Teams approval interfaces',
      'Conditional approval with constraints',
      'Full approval audit trail',
    ],
  },

  whyItMatters: {
    heading: 'Why human-in-the-loop is essential',
    description: 'Even the best policy engine and risk scorer cannot replace human judgment for truly critical decisions. Approval workflows ensure humans remain in control of what matters.',
    benefits: [
      { title: 'Risk Mitigation', description: 'Critical actions are reviewed by qualified humans before execution, preventing autonomous agents from causing irreversible damage.' },
      { title: 'Regulatory Compliance', description: 'Many regulations require human oversight for certain actions. Approval workflows provide auditable proof of human review.' },
      { title: 'Organizational Control', description: 'Maintain organizational approval hierarchies and delegation chains, ensuring the right people approve the right actions.' },
    ],
  },

  capabilities: [
    { icon: Users, title: 'Multi-Party Approval', description: 'Require multiple approvers with configurable quorum (e.g., 2 of 3 must approve).' },
    { icon: Clock, title: 'SLA Timers', description: 'Automatic escalation when approvals exceed configured time limits.' },
    { icon: Bell, title: 'Notifications', description: 'Push notifications via Slack, Teams, email, and mobile for pending approvals.' },
    { icon: Shield, title: 'Conditional Approval', description: 'Approve with constraints — time limits, scope restrictions, or monitoring requirements.' },
    { icon: Layers, title: 'Escalation Chains', description: 'Define multi-tier escalation paths when primary approvers are unavailable.' },
    { icon: CheckCircle, title: 'Delegation', description: 'Approvers can delegate to trusted alternates with configurable delegation policies.' },
    { icon: Settings, title: 'Routing Rules', description: 'Route approvals based on risk score, agent identity, tool type, or custom attributes.' },
    { icon: FileText, title: 'Context Cards', description: 'Present reviewers with rich context — risk analysis, policy evaluation, and historical patterns.' },
    { icon: GitBranch, title: 'Workflow Designer', description: 'Visual workflow designer for complex approval chains with branching and conditions.' },
  ],

  architecture: {
    description: 'The Approval Workflow Engine integrates with the policy engine and risk scorer to automatically route actions that exceed approval thresholds.',
    layers: [
      { label: 'Trigger Layer', items: ['Policy Engine Hook', 'Risk Threshold Trigger', 'Manual Request', 'API Trigger'] },
      { label: 'Workflow Engine', items: ['Router', 'Escalation Timer', 'Quorum Checker', 'Delegation Resolver'] },
      { label: 'Notification', items: ['Slack Bot', 'Teams Bot', 'Email Service', 'Mobile Push', 'Webhook'] },
      { label: 'Decision Store', items: ['Approval Log', 'Decision Cache', 'SLA Tracker', 'Audit Writer'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Threshold exceeded', description: 'Policy engine or risk scorer determines the action requires human approval.' },
      { label: 'Request created', description: 'Approval request is created with full context: agent, tool, risk score, and policy details.' },
      { label: 'Routed to reviewers', description: 'Request is sent to designated approvers via configured notification channels.' },
      { label: 'SLA timer starts', description: 'Escalation timer begins. If no response within SLA, the request escalates.' },
      { label: 'Reviewer decides', description: 'Approver reviews context and approves, denies, or approves with constraints.' },
      { label: 'Decision enforced', description: 'Approval decision is returned to the runtime interceptor for enforcement.' },
    ],
  },

  codeExample: {
    title: 'approval-workflow.yaml',
    language: 'yaml',
    code: `# Runwall Approval Workflow Configuration
workflows:
  - name: "high-risk-tool-access"
    trigger:
      risk_score_above: 0.7
      tool_risk_level: "high"

    approval:
      type: "quorum"
      required_approvals: 2
      approver_pool:
        - role: "security-lead"
        - role: "platform-admin"

    escalation:
      - after: "15m"
        notify: ["engineering-manager"]
      - after: "1h"
        notify: ["vp-engineering"]
        auto_action: "deny"

    sla:
      response_time: "30m"
      resolution_time: "2h"

    notifications:
      channels:
        - type: "slack"
          channel: "#agent-approvals"
        - type: "email"
          template: "approval-request"

    on_timeout: "deny"
    on_approve:
      constraints:
        max_duration: "1h"
        monitoring: "enhanced"`,
  },

  faq: [
    { question: 'What happens to the agent while waiting for approval?', answer: 'The agent action is suspended and queued. The runtime interceptor holds the request until a decision is made. Agents can be configured to continue other work or wait synchronously.' },
    { question: 'Can approvals be automated for known-safe patterns?', answer: 'Yes. You can define auto-approval rules for patterns that have been manually approved multiple times. This creates a learning feedback loop that reduces approval fatigue over time.' },
    { question: 'What if all approvers are unavailable?', answer: 'Escalation chains ensure the request reaches someone who can act. After all escalation tiers are exhausted, a configurable default action (typically deny) is applied.' },
    { question: 'Can I integrate with my existing ticketing system?', answer: 'Yes. Runwall integrates with Jira, ServiceNow, and custom ticketing systems via webhooks. Approval requests can create tickets and sync decisions bidirectionally.' },
  ],
};

export default function ApprovalWorkflowEngine() {
  return <FeaturePageTemplate data={data} />;
}
