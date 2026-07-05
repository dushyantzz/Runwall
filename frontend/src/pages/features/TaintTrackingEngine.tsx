import { Route, Eye, Database, GitBranch, Shield, AlertTriangle, Search, Layers, Tag } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Route,
  title: 'Taint Tracking Engine',
  subtitle: 'Track data lineage and taint propagation across agent execution chains. Detect when sensitive data flows into unauthorized contexts and prevent contamination before it spreads.',
  badgeText: 'Data Lineage',

  problem: {
    heading: 'Sensitive data flows freely through agent chains',
    description: 'AI agents process data from multiple sources and pass it between tools, prompts, and other agents. Without taint tracking, PII, secrets, and classified data propagate silently through execution chains.',
    points: [
      'PII from one tool leaks into prompts sent to another',
      'Secrets extracted from databases flow into external API calls',
      'No visibility into data lineage across agent execution chains',
      'Compliance violations are discovered after the fact, not prevented',
      'Data classification labels are lost during agent processing',
    ],
  },

  whatItDoes: {
    heading: 'Information flow tracking for AI agents',
    description: 'Runwall\'s Taint Tracking Engine labels data at its source, propagates taint through agent execution chains, and enforces flow policies at every boundary.',
    points: [
      'Automatic data classification and labeling',
      'Taint propagation through execution chains',
      'Cross-agent data flow tracking',
      'Policy-based flow enforcement',
      'Real-time contamination alerts',
      'Data lineage visualization',
      'PII and secret detection',
      'Compliance-ready data flow reports',
    ],
  },

  whyItMatters: {
    heading: 'Why data lineage is essential for AI governance',
    description: 'Taint tracking is the only way to ensure that sensitive data never reaches an unauthorized context — even when agents make autonomous decisions about how to process and route information.',
    benefits: [
      { title: 'Prevent Data Leakage', description: 'Block sensitive data from flowing into unauthorized tools, APIs, or external services — in real-time.' },
      { title: 'Regulatory Compliance', description: 'Prove to auditors exactly where every piece of sensitive data went, who accessed it, and what policies governed it.' },
      { title: 'Attack Detection', description: 'Detect prompt injection and data exfiltration attacks by monitoring for unexpected taint propagation patterns.' },
    ],
  },

  capabilities: [
    { icon: Eye, title: 'Auto Classification', description: 'Automatically detect and classify PII, secrets, financial data, and custom sensitive data types.' },
    { icon: Database, title: 'Lineage Tracking', description: 'Track data from source through every transformation, tool invocation, and agent handoff.' },
    { icon: GitBranch, title: 'Propagation Engine', description: 'Taint labels propagate through data transformations, preserving classification through the entire chain.' },
    { icon: Shield, title: 'Flow Policies', description: 'Define which taint labels can flow to which tools, agents, and external services.' },
    { icon: AlertTriangle, title: 'Contamination Alerts', description: 'Real-time alerts when tainted data reaches an unauthorized boundary.' },
    { icon: Search, title: 'Lineage Queries', description: 'Query the full lineage of any data point — where it came from, where it went, and who touched it.' },
    { icon: Layers, title: 'Cross-Agent Tracking', description: 'Track taint across multi-agent workflows where data passes between different agent instances.' },
    { icon: Tag, title: 'Custom Labels', description: 'Define custom taint labels for domain-specific data types beyond standard PII and secrets.' },
    { icon: Route, title: 'Flow Visualization', description: 'Visual data flow diagrams showing taint propagation across your agent ecosystem.' },
  ],

  architecture: {
    description: 'The Taint Tracking Engine hooks into the runtime interceptor to label and track data at every execution boundary.',
    layers: [
      { label: 'Classification', items: ['PII Detector', 'Secret Scanner', 'Custom Classifiers', 'Schema-Based Labels'] },
      { label: 'Propagation', items: ['Taint Propagator', 'Transform Tracker', 'Cross-Agent Bridge', 'Label Merger'] },
      { label: 'Enforcement', items: ['Flow Policy Engine', 'Boundary Checker', 'Redaction Engine', 'Alert Generator'] },
      { label: 'Analytics', items: ['Lineage Store', 'Flow Visualizer', 'Compliance Reporter', 'Query Engine'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Data enters', description: 'Data arrives from a tool response, user input, or external source.' },
      { label: 'Classification', description: 'Automatic classifiers detect sensitive data types and assign taint labels.' },
      { label: 'Label attached', description: 'Taint labels are attached to the data and propagated through the execution context.' },
      { label: 'Agent processes', description: 'As the agent transforms and routes data, taint labels propagate with it.' },
      { label: 'Boundary check', description: 'When data reaches a tool or external boundary, flow policies are evaluated.' },
      { label: 'Enforce or alert', description: 'Data is allowed, redacted, or blocked based on taint labels and flow policies.' },
    ],
  },

  codeExample: {
    title: 'taint-policy.yaml',
    language: 'yaml',
    code: `# Runwall Taint Tracking Configuration
taint_engine:
  auto_classify: true
  propagation_mode: "strict"

classifiers:
  - type: "pii"
    patterns: ["email", "phone", "ssn", "address"]
    confidence_threshold: 0.85
  - type: "secrets"
    patterns: ["api_key", "password", "token", "private_key"]
    confidence_threshold: 0.95
  - type: "financial"
    patterns: ["credit_card", "bank_account", "routing_number"]
    confidence_threshold: 0.90

flow_policies:
  - taint: "pii"
    deny_targets:
      - "external_api"
      - "logging_service"
    allow_targets:
      - "internal_db"
      - "encrypted_storage"

  - taint: "secrets"
    deny_targets: ["*"]
    allow_targets: ["credential_vault"]
    action_on_violation: "block_and_alert"`,
  },

  faq: [
    { question: 'How does taint propagation work?', answer: 'When data is classified, a taint label is attached. As the data flows through agent processing — transformations, concatenations, tool calls — the taint label propagates to derived data. This ensures that even transformed sensitive data retains its classification.' },
    { question: 'What data types are auto-classified?', answer: 'Out of the box, the engine detects PII (emails, phone numbers, SSNs, addresses), secrets (API keys, passwords, tokens), and financial data (credit cards, bank accounts). You can add custom classifiers for domain-specific data types.' },
    { question: 'Does taint tracking add latency?', answer: 'Taint classification and label propagation add minimal overhead (typically under 0.5ms). Flow policy evaluation at boundaries is combined with the existing policy engine evaluation.' },
    { question: 'Can I track data across multi-agent workflows?', answer: 'Yes. The cross-agent bridge maintains taint labels across agent boundaries, ensuring that data classification persists even when data passes between different agent instances or services.' },
  ],
};

export default function TaintTrackingEngine() {
  return <FeaturePageTemplate data={data} />;
}
