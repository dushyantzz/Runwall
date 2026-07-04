import { BarChart3, AlertTriangle, TrendingUp, Brain, Layers, Shield, Activity, Settings, Database } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: BarChart3,
  title: 'Risk Scoring Engine',
  subtitle: 'Compute composite risk scores from multiple signals — agent identity, tool sensitivity, data classification, historical behavior, and real-time context — to drive governance decisions.',
  badgeText: 'Risk Analysis',

  problem: {
    heading: 'Binary allow/deny is not enough',
    description: 'Simple allow/deny policies cannot express the nuance of real-world risk. A tool invocation that is safe in one context may be dangerous in another. Without risk scoring, governance is either too permissive or too restrictive.',
    points: [
      'Policies are binary — no concept of risk gradients',
      'Same action treated identically regardless of context',
      'No way to escalate based on accumulated risk',
      'Historical behavior patterns are ignored',
      'No composite scoring across multiple risk dimensions',
    ],
  },

  whatItDoes: {
    heading: 'Continuous, multi-dimensional risk evaluation',
    description: 'AegisGuard\'s Risk Scoring Engine computes a composite risk score for every agent action by combining signals from identity, tool metadata, data classification, and behavioral analytics.',
    points: [
      'Multi-signal composite risk scoring',
      'Configurable risk dimensions and weights',
      'Threshold-based alerting and escalation',
      'Historical behavior anomaly detection',
      'Real-time risk dashboards',
      'Risk score integration with policy engine',
      'Per-agent and per-tool risk profiles',
      'ML-assisted risk prediction',
    ],
  },

  whyItMatters: {
    heading: 'Why risk-aware governance is critical',
    description: 'Risk scoring transforms governance from a blunt instrument into a precision tool — enabling nuanced decisions that balance security with agent productivity.',
    benefits: [
      { title: 'Nuanced Decisions', description: 'Instead of binary allow/deny, make risk-proportional decisions: allow, require approval, rate limit, or block.' },
      { title: 'Adaptive Security', description: 'Risk thresholds adapt based on context — tighter during incidents, relaxed during normal operations.' },
      { title: 'Predictive Prevention', description: 'Detect and prevent risky patterns before they cause incidents, using behavioral analytics and ML.' },
    ],
  },

  capabilities: [
    { icon: TrendingUp, title: 'Composite Scoring', description: 'Combine identity, tool, data, behavior, and context signals into a single 0-1 risk score.' },
    { icon: Brain, title: 'ML Risk Models', description: 'Train custom risk models on your historical data. Detect anomalies that rule-based systems miss.' },
    { icon: AlertTriangle, title: 'Threshold Alerts', description: 'Configure risk thresholds that trigger alerts, require approval, or block execution.' },
    { icon: Layers, title: 'Risk Dimensions', description: 'Define custom risk dimensions with configurable weights and scoring algorithms.' },
    { icon: Shield, title: 'Policy Integration', description: 'Risk scores are automatically available in the policy engine as evaluation inputs.' },
    { icon: Activity, title: 'Real-Time Dashboard', description: 'Monitor risk scores across agents, tools, and tenants in real-time.' },
    { icon: Settings, title: 'Risk Profiles', description: 'Per-agent and per-tool risk profiles that accumulate and decay over time.' },
    { icon: Database, title: 'Historical Analysis', description: 'Query historical risk data for trend analysis, investigations, and reporting.' },
    { icon: BarChart3, title: 'Risk Reports', description: 'Generate risk reports for compliance teams with dimension breakdowns and trend analysis.' },
  ],

  architecture: {
    description: 'The Risk Scoring Engine operates as a stateful service within the governance pipeline, maintaining risk profiles and computing scores in real-time.',
    layers: [
      { label: 'Signal Collection', items: ['Identity Signals', 'Tool Metadata', 'Data Classification', 'Behavioral History'] },
      { label: 'Scoring Engine', items: ['Dimension Evaluator', 'Weight Calculator', 'Composite Scorer', 'ML Predictor'] },
      { label: 'Decision Layer', items: ['Threshold Evaluator', 'Alert Generator', 'Escalation Router', 'Policy Enricher'] },
      { label: 'Storage', items: ['Risk Profile Store', 'Score History', 'Analytics DB', 'Model Registry'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Signals collected', description: 'Identity, tool, data, and behavioral signals are gathered from the request context.' },
      { label: 'Dimensions scored', description: 'Each risk dimension is evaluated independently using its configured algorithm.' },
      { label: 'Weights applied', description: 'Dimension scores are weighted based on the current risk profile and context.' },
      { label: 'Composite computed', description: 'Final composite score (0-1) is computed from weighted dimension scores.' },
      { label: 'Threshold evaluated', description: 'Score is compared against configured thresholds to determine the governance action.' },
      { label: 'Profile updated', description: 'Agent and tool risk profiles are updated with the latest score.' },
    ],
  },

  codeExample: {
    title: 'risk-config.yaml',
    language: 'yaml',
    code: `# AegisGuard Risk Scoring Configuration
risk_engine:
  scoring_model: "weighted_composite"
  default_threshold: 0.7

dimensions:
  - name: "identity_risk"
    weight: 0.2
    signals:
      - agent_age_days
      - authentication_method
      - role_privilege_level

  - name: "tool_risk"
    weight: 0.3
    signals:
      - tool_risk_classification
      - side_effects
      - data_access_scope

  - name: "behavioral_risk"
    weight: 0.3
    signals:
      - action_frequency_anomaly
      - pattern_deviation
      - historical_violations

  - name: "context_risk"
    weight: 0.2
    signals:
      - time_of_day
      - geo_location
      - concurrent_sessions

thresholds:
  low: { max: 0.3, action: "allow" }
  medium: { max: 0.7, action: "allow_with_logging" }
  high: { max: 0.9, action: "require_approval" }
  critical: { max: 1.0, action: "deny" }`,
  },

  faq: [
    { question: 'How is the risk score calculated?', answer: 'Risk scores are computed as a weighted composite of multiple dimensions. Each dimension evaluates specific signals (identity, tool, behavior, context) and produces a 0-1 score. Dimension scores are combined using configurable weights to produce the final composite score.' },
    { question: 'Can I customize risk dimensions?', answer: 'Yes. You can define custom dimensions, configure signals, set weights, and implement custom scoring algorithms. The engine supports both rule-based and ML-based scoring.' },
    { question: 'Does the risk score change over time?', answer: 'Yes. Agent and tool risk profiles accumulate and decay over time based on behavior. An agent with a history of violations will have an elevated baseline risk score.' },
    { question: 'How do risk scores integrate with policies?', answer: 'Risk scores are injected into the policy evaluation context as input.risk_score. Policies can reference risk scores directly in Rego or CEL expressions for nuanced governance decisions.' },
  ],
};

export default function RiskScoringEngine() {
  return <FeaturePageTemplate data={data} />;
}
