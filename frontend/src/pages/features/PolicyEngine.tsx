import { FileCode2, Shield, Code, GitBranch, History, Layers, Zap, AlertTriangle, Settings } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: FileCode2,
  title: 'Policy Engine',
  subtitle: 'Define, version, and enforce governance policies using Rego or CEL. Evaluate every agent action against attribute-based rules with full version history and rollback.',
  badgeText: 'Policy Enforcement',

  problem: {
    heading: 'Agent governance rules are hardcoded and fragile',
    description: 'Without a dedicated policy engine, governance logic is scattered across application code, config files, and ad-hoc middleware — making it impossible to audit, version, or update safely.',
    points: [
      'Governance rules hardcoded in application logic',
      'No version control or rollback for policy changes',
      'Policy changes require code deployments',
      'Cannot express complex attribute-based conditions',
      'No dry-run or simulation before policy deployment',
    ],
  },

  whatItDoes: {
    heading: 'Declarative policy evaluation at every decision point',
    description: 'Runwall\'s Policy Engine evaluates every agent action against declarative Rego or CEL policies with sub-millisecond latency, full version history, and simulation capabilities.',
    points: [
      'Rego and CEL policy language support',
      'Attribute-based access control (ABAC)',
      'Policy versioning with full change history',
      'Dry-run and simulation mode',
      'Hot-reload without restarts',
      'Policy testing and validation framework',
      'Hierarchical policy composition',
      'Real-time policy evaluation metrics',
    ],
  },

  whyItMatters: {
    heading: 'Why declarative policies win',
    description: 'Declarative policies separate governance intent from execution logic — enabling security teams, compliance officers, and platform engineers to collaborate on rules without touching agent code.',
    benefits: [
      { title: 'Separation of Concerns', description: 'Policy authors don\'t need to understand agent internals. Developers don\'t need to implement governance logic.' },
      { title: 'Safe Deployments', description: 'Dry-run mode evaluates new policies against real traffic before activation. Rollback takes seconds, not hours.' },
      { title: 'Audit Readiness', description: 'Every policy decision is logged with the exact policy version, input context, and evaluation result.' },
    ],
  },

  capabilities: [
    { icon: Code, title: 'Rego/CEL Support', description: 'Write policies in industry-standard Rego (OPA) or CEL with full language support and autocompletion.' },
    { icon: Shield, title: 'ABAC Engine', description: 'Evaluate policies against agent attributes, environment context, resource metadata, and request properties.' },
    { icon: GitBranch, title: 'Version Control', description: 'Every policy change is versioned with diffs, authors, and rollback capability.' },
    { icon: History, title: 'Policy History', description: 'Full audit trail of policy changes, deployments, and evaluation outcomes.' },
    { icon: Layers, title: 'Policy Composition', description: 'Compose complex policies from reusable modules with clear precedence rules.' },
    { icon: Zap, title: 'Hot Reload', description: 'Update policies without restarting the governance gateway. Changes propagate in seconds.' },
    { icon: AlertTriangle, title: 'Dry Run', description: 'Evaluate new policies against live traffic in shadow mode before activating enforcement.' },
    { icon: Settings, title: 'Testing Framework', description: 'Write unit and integration tests for policies with fixture data and expected outcomes.' },
    { icon: FileCode2, title: 'Policy IDE', description: 'Browser-based policy editor with syntax highlighting, linting, and real-time validation.' },
  ],

  architecture: {
    description: 'The Policy Engine sits at the core of the governance pipeline, receiving enriched context from identity, risk, and taint modules before evaluating each decision.',
    layers: [
      { label: 'Policy Authoring', items: ['Policy IDE', 'CLI Tools', 'Git Sync', 'Template Library'] },
      { label: 'Policy Management', items: ['Version Store', 'Deployment Manager', 'Dry-Run Engine', 'Test Runner'] },
      { label: 'Evaluation Runtime', items: ['Rego Evaluator', 'CEL Evaluator', 'Context Enricher', 'Decision Logger'] },
      { label: 'Integration', items: ['Gateway Hook', 'SDK Middleware', 'Webhook Notifier', 'Metrics Exporter'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Policy authored', description: 'Security or platform team writes a policy in Rego or CEL using the Policy IDE.' },
      { label: 'Tests executed', description: 'Policy is validated against the test suite with fixture data and expected outcomes.' },
      { label: 'Dry-run deployed', description: 'Policy evaluates against live traffic in shadow mode — no enforcement.' },
      { label: 'Impact reviewed', description: 'Team reviews dry-run results to verify expected allow/deny distribution.' },
      { label: 'Activated', description: 'Policy is promoted to enforcement mode with a new version tag.' },
      { label: 'Monitoring', description: 'Evaluation metrics and decision logs are monitored for anomalies.' },
    ],
  },

  codeExample: {
    title: 'policy.rego',
    language: 'rego',
    code: `# Runwall Policy — Restrict high-risk tool access
package runwall.tools

import future.keywords.in

# Default deny
default allow := false

# Allow if agent has required role and risk is acceptable
allow if {
    input.agent.role in data.allowed_roles
    input.risk_score < 0.7
    not input.taint.contains_pii
}

# Allow read-only tools for any authenticated agent
allow if {
    input.tool.side_effects == false
    input.agent.authenticated == true
    input.risk_score < 0.5
}

# Require approval for high-risk operations
require_approval if {
    input.risk_score >= 0.7
    input.tool.risk_level == "high"
}

# Emit violation reason for denied requests
violations[msg] {
    not allow
    msg := sprintf("Agent %s denied: risk=%v, taint=%v",
        [input.agent.id, input.risk_score, input.taint])
}`,
  },

  faq: [
    { question: 'Do I need to learn Rego or CEL?', answer: 'Runwall provides a template library and visual policy builder for common patterns. For advanced policies, Rego and CEL offer maximum flexibility. Both languages have excellent documentation and community support.' },
    { question: 'How fast is policy evaluation?', answer: 'Policy evaluation typically completes in under 1ms. Policies are pre-compiled and cached. The engine supports parallel evaluation for complex policy bundles.' },
    { question: 'Can I use both Rego and CEL in the same deployment?', answer: 'Yes. Different policies can use different languages. The evaluation engine normalizes results from both into a unified decision format.' },
    { question: 'How do I test policies before deploying?', answer: 'Use the built-in testing framework to write test cases with fixture data. Run tests in CI/CD pipelines. Use dry-run mode to evaluate against live traffic without enforcement.' },
  ],
};

export default function PolicyEngine() {
  return <FeaturePageTemplate data={data} />;
}
