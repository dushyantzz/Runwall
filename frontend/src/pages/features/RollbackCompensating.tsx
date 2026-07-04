import { RotateCcw, History, Shield, AlertTriangle, GitBranch, Database, CheckCircle, Clock, Layers } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: RotateCcw,
  title: 'Rollback / Compensating Actions',
  subtitle: 'Undo agent actions and execute compensating transactions when operations fail or policies are violated — restoring system state to a known-good condition.',
  badgeText: 'Recovery',

  problem: {
    heading: 'Agent failures leave systems in broken states',
    description: 'When an agent action fails midway through a multi-step operation, or when a post-execution check reveals a policy violation, there is no mechanism to undo the damage.',
    points: [
      'Failed multi-step operations leave partial state changes',
      'No automated rollback when policy violations are detected post-execution',
      'Manual cleanup requires deep system knowledge and is error-prone',
      'Compensating transactions are not defined or tested',
      'No recovery plan for autonomous agent failures in production',
    ],
  },

  whatItDoes: {
    heading: 'Automated recovery for agent actions',
    description: 'AegisGuard defines and executes compensating transactions for every governed action, enabling automated rollback when failures or violations are detected.',
    points: [
      'Automatic compensating transaction generation',
      'Multi-step rollback orchestration',
      'Post-violation recovery procedures',
      'Rollback testing and validation',
      'Partial rollback for multi-step operations',
      'Rollback audit trail',
      'Manual rollback triggers',
      'Recovery point management',
    ],
  },

  whyItMatters: {
    heading: 'Why rollback capability is essential',
    description: 'Autonomous agents will inevitably cause unintended side effects. Rollback capability transforms those incidents from crises into managed recoveries.',
    benefits: [
      { title: 'Damage Containment', description: 'Automatically reverse agent actions that violated policies or caused failures, minimizing blast radius.' },
      { title: 'Operational Confidence', description: 'Teams deploy agents more confidently knowing every action can be reversed if needed.' },
      { title: 'Incident Recovery', description: 'Reduce mean time to recovery (MTTR) from hours of manual cleanup to seconds of automated rollback.' },
    ],
  },

  capabilities: [
    { icon: History, title: 'Action History', description: 'Complete record of every agent action with state snapshots for point-in-time recovery.' },
    { icon: Shield, title: 'Auto-Compensate', description: 'Automatically generate and execute compensating transactions for supported tool operations.' },
    { icon: AlertTriangle, title: 'Violation Recovery', description: 'Trigger rollback when post-execution policy checks detect violations.' },
    { icon: GitBranch, title: 'Multi-Step Rollback', description: 'Orchestrate rollback across multi-step agent operations in reverse order.' },
    { icon: Database, title: 'State Snapshots', description: 'Capture system state before agent actions for point-in-time recovery.' },
    { icon: CheckCircle, title: 'Rollback Testing', description: 'Test compensating transactions in dry-run mode before registering them.' },
    { icon: Clock, title: 'Recovery Windows', description: 'Configurable time windows during which rollback is available for each action type.' },
    { icon: Layers, title: 'Partial Rollback', description: 'Roll back specific steps in a multi-step operation while preserving others.' },
    { icon: RotateCcw, title: 'Manual Triggers', description: 'Operations teams can trigger rollback for any recorded action via API or dashboard.' },
  ],

  architecture: {
    description: 'The Rollback Engine integrates with the audit log and runtime interceptor to track actionable state and execute compensating transactions.',
    layers: [
      { label: 'State Capture', items: ['Pre-Action Snapshot', 'State Differ', 'Checkpoint Manager'] },
      { label: 'Compensation Registry', items: ['Transaction Definitions', 'Rollback Plans', 'Recovery Procedures'] },
      { label: 'Execution', items: ['Rollback Orchestrator', 'Step Reverser', 'Verification Engine'] },
      { label: 'Monitoring', items: ['Recovery Dashboard', 'Rollback Audit Log', 'Alert Integration'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Action recorded', description: 'Agent action is executed and recorded with pre/post state snapshots.' },
      { label: 'Failure detected', description: 'Post-execution check, policy violation, or manual trigger initiates rollback.' },
      { label: 'Plan generated', description: 'Compensating transaction plan is generated from the action history.' },
      { label: 'Rollback executed', description: 'Compensating transactions execute in reverse order of original actions.' },
      { label: 'State verified', description: 'System state is verified against the pre-action snapshot.' },
      { label: 'Recovery logged', description: 'Rollback results are logged to the audit trail with full details.' },
    ],
  },

  codeExample: {
    title: 'rollback-config.yaml',
    language: 'yaml',
    code: `# AegisGuard Rollback Configuration
rollback:
  auto_compensate: true
  recovery_window: "24h"
  snapshot_retention: "7d"

compensating_actions:
  - tool: "database.write"
    compensation: "database.delete"
    verify_after: true

  - tool: "api.post"
    compensation: "api.delete"
    requires_idempotency_key: true

  - tool: "file.create"
    compensation: "file.delete"
    snapshot_content: true

triggers:
  - type: "policy_violation"
    action: "auto_rollback"
    notify: ["ops-team"]

  - type: "risk_threshold_exceeded"
    action: "suspend_and_notify"
    threshold: 0.9

  - type: "manual"
    authorized_roles: ["platform-admin", "security-lead"]`,
  },

  faq: [
    { question: 'Can all agent actions be rolled back?', answer: 'Rollback is supported for operations with defined compensating transactions. Some operations (e.g., sending emails, external API calls) may not be fully reversible, but AegisGuard tracks them and notifies operators.' },
    { question: 'How quickly can a rollback execute?', answer: 'Automated rollbacks typically complete in seconds for single actions. Multi-step rollbacks depend on the number of steps and external system latency.' },
    { question: 'What happens if the rollback itself fails?', answer: 'Failed rollbacks trigger alerts to the operations team with full diagnostic information. The system enters a "requires manual intervention" state with detailed recovery guidance.' },
    { question: 'Can I test rollback procedures?', answer: 'Yes. Compensating transactions can be tested in dry-run mode. The testing framework simulates failures and validates that rollback restores expected state.' },
  ],
};

export default function RollbackCompensating() {
  return <FeaturePageTemplate data={data} />;
}
