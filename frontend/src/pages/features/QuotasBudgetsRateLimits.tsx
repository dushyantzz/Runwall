import { Gauge, DollarSign, Clock, BarChart3, Shield, AlertTriangle, Settings, Layers, Activity } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Gauge,
  title: 'Quotas / Budgets / Rate Limits',
  subtitle: 'Enforce usage caps, cost controls, and per-agent rate limiting across your agent infrastructure — preventing runaway costs and resource exhaustion.',
  badgeText: 'Resource Governance',

  problem: {
    heading: 'Agent resource usage is unbounded',
    description: 'Without quotas and rate limits, a single misbehaving agent can exhaust API credits, overwhelm downstream services, or generate unbounded cloud costs in minutes.',
    points: [
      'No per-agent or per-team usage limits',
      'API costs spike unexpectedly from agent loops or retries',
      'Downstream services are overwhelmed by agent request volume',
      'No budget controls to cap spending per project or tenant',
      'Rate limiting is implemented ad-hoc and inconsistently',
    ],
  },

  whatItDoes: {
    heading: 'Comprehensive resource governance for AI agents',
    description: 'Runwall enforces quotas, budgets, and rate limits at every level — per agent, per team, per tenant, and per tool — with real-time tracking and alerting.',
    points: [
      'Per-agent and per-team rate limits',
      'Budget caps with real-time cost tracking',
      'Quota management with configurable periods',
      'Burst allowance with token bucket algorithm',
      'Cost attribution and chargeback reporting',
      'Automatic throttling and graceful degradation',
      'Budget alerts and threshold notifications',
      'Usage dashboards and trend analysis',
    ],
  },

  whyItMatters: {
    heading: 'Why resource governance prevents disasters',
    description: 'A single agent running in a loop can generate thousands of API calls per minute. Without limits, this becomes a cost, reliability, and security incident.',
    benefits: [
      { title: 'Cost Control', description: 'Set hard budget caps per agent, team, and project. Never wake up to a surprise cloud bill from a runaway agent.' },
      { title: 'System Stability', description: 'Rate limiting prevents agents from overwhelming downstream services, maintaining reliability for all consumers.' },
      { title: 'Fair Resource Sharing', description: 'Quota allocation ensures equitable resource distribution across teams and agents within the organization.' },
    ],
  },

  capabilities: [
    { icon: DollarSign, title: 'Budget Caps', description: 'Set spending limits per agent, team, or project with hard and soft thresholds.' },
    { icon: Clock, title: 'Rate Limiting', description: 'Token bucket and sliding window rate limiting with configurable burst allowances.' },
    { icon: BarChart3, title: 'Usage Tracking', description: 'Real-time usage dashboards with cost attribution, trend analysis, and forecasting.' },
    { icon: Shield, title: 'Quota Enforcement', description: 'Enforce action quotas per time period (minute, hour, day) with configurable granularity.' },
    { icon: AlertTriangle, title: 'Budget Alerts', description: 'Proactive alerts at configurable thresholds (50%, 75%, 90%, 100%) before limits are hit.' },
    { icon: Settings, title: 'Policy Integration', description: 'Quota status is available in the policy engine for dynamic governance decisions.' },
    { icon: Layers, title: 'Hierarchical Limits', description: 'Nested limits (org → team → agent) with configurable inheritance and override.' },
    { icon: Activity, title: 'Graceful Degradation', description: 'When limits are approached, agents are throttled rather than hard-blocked.' },
    { icon: Gauge, title: 'Chargeback Reports', description: 'Generate cost attribution reports for internal billing and chargeback.' },
  ],

  architecture: {
    description: 'The Quota Engine operates as a high-performance counter system within the governance pipeline, tracking usage in real-time with minimal latency.',
    layers: [
      { label: 'Counter Layer', items: ['Rate Limiter', 'Quota Counter', 'Budget Tracker', 'Burst Calculator'] },
      { label: 'Policy Layer', items: ['Limit Resolver', 'Hierarchy Engine', 'Override Manager', 'Exemption Handler'] },
      { label: 'Enforcement', items: ['Throttle Controller', 'Block Handler', 'Graceful Degrader', 'Queue Manager'] },
      { label: 'Analytics', items: ['Usage Dashboard', 'Cost Calculator', 'Trend Analyzer', 'Forecast Engine'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Request arrives', description: 'Agent requests a tool invocation through the governance pipeline.' },
      { label: 'Quota checked', description: 'Current usage is checked against all applicable quotas (agent, team, org).' },
      { label: 'Rate evaluated', description: 'Request rate is evaluated against rate limit policies.' },
      { label: 'Budget verified', description: 'Estimated action cost is checked against remaining budget.' },
      { label: 'Decision made', description: 'Request is allowed, throttled, queued, or denied based on resource state.' },
      { label: 'Counters updated', description: 'Usage counters and budget trackers are updated atomically.' },
    ],
  },

  codeExample: {
    title: 'quota-config.yaml',
    language: 'yaml',
    code: `# Runwall Quota & Rate Limit Configuration
quotas:
  global:
    max_actions_per_day: 10000000
    max_cost_per_month: 50000

  per_tenant:
    max_agents: 500
    max_actions_per_day: 1000000
    max_cost_per_month: 10000

  per_agent:
    max_actions_per_minute: 100
    max_actions_per_hour: 2000
    max_cost_per_day: 50

rate_limits:
  algorithm: "token_bucket"
  default:
    rate: 60
    burst: 20
    period: "1m"

  high_risk_tools:
    rate: 10
    burst: 3
    period: "1m"

budget_alerts:
  thresholds: [50, 75, 90, 100]
  channels:
    - type: "slack"
      channel: "#cost-alerts"
    - type: "email"
      recipients: ["finance@company.com"]

  on_budget_exceeded:
    action: "throttle"
    reduce_rate_to: "10%"`,
  },

  faq: [
    { question: 'What rate limiting algorithms are supported?', answer: 'Runwall supports token bucket, sliding window, and fixed window algorithms. Token bucket is the default, offering smooth rate limiting with configurable burst allowances.' },
    { question: 'Can I set different limits for different tools?', answer: 'Yes. Rate limits and quotas can be configured per tool, per risk level, or per agent-tool combination. High-risk tools can have stricter limits than low-risk ones.' },
    { question: 'How does cost tracking work?', answer: 'Each tool invocation has an associated cost (configurable per tool). The budget tracker sums costs in real-time and compares against configured limits. Costs can be pulled from actual API billing or estimated from usage patterns.' },
    { question: 'What happens when a quota is exceeded?', answer: 'Configurable behavior: hard block, throttle to a reduced rate, queue for later execution, or allow with alert. The default is to throttle rather than hard-block for better agent experience.' },
  ],
};

export default function QuotasBudgetsRateLimits() {
  return <FeaturePageTemplate data={data} />;
}
