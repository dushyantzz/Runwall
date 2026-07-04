import { Radio, Shield, Zap, Clock, Filter, Layers, Activity, Settings, AlertTriangle } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Radio,
  title: 'Runtime Interceptor / Gateway',
  subtitle: 'A transparent governance proxy that intercepts every agent-to-tool communication in real-time — enforcing policies, scoring risk, and logging evidence with sub-millisecond overhead.',
  badgeText: 'Runtime Gateway',

  problem: {
    heading: 'Agent actions execute without a control plane',
    description: 'Without a runtime interceptor, agents communicate directly with tools and APIs. There is no enforcement point, no real-time policy evaluation, and no way to block dangerous actions before they execute.',
    points: [
      'No centralized enforcement point for agent actions',
      'Direct agent-to-tool communication bypasses governance',
      'Cannot block dangerous actions in real-time',
      'Policy changes require agent restarts to take effect',
      'No request/response inspection for compliance',
    ],
  },

  whatItDoes: {
    heading: 'The governance control plane for every agent action',
    description: 'AegisGuard\'s Runtime Interceptor sits between agents and their tools, transparently intercepting every request and response to enforce governance in real-time.',
    points: [
      'Transparent request/response interception',
      'Pre-execution policy enforcement',
      'Post-execution validation and logging',
      'Sub-millisecond evaluation overhead',
      'Protocol-agnostic (HTTP, gRPC, MCP, WebSocket)',
      'Request transformation and redaction',
      'Circuit breaker and fallback patterns',
      'Real-time metrics and alerting',
    ],
  },

  whyItMatters: {
    heading: 'Why runtime enforcement is non-negotiable',
    description: 'Static analysis and pre-deployment checks are necessary but insufficient. Only runtime interception can enforce governance on live agent behavior.',
    benefits: [
      { title: 'Real-Time Control', description: 'Block dangerous actions as they happen — not after the damage is done. Every request is evaluated before execution.' },
      { title: 'Zero Code Changes', description: 'Deploy as a sidecar or gateway. No agent code modification required. Works with any agent framework.' },
      { title: 'Complete Visibility', description: 'Every request, response, decision, and latency metric is captured for audit and observability.' },
    ],
  },

  capabilities: [
    { icon: Shield, title: 'Pre-Execution Gates', description: 'Evaluate policies, check risk scores, and verify approval status before allowing tool invocation.' },
    { icon: Zap, title: 'Sub-ms Overhead', description: 'Optimized evaluation pipeline adds less than 1ms to request latency in typical configurations.' },
    { icon: Clock, title: 'Post-Execution Hooks', description: 'Inspect responses, validate outputs, and trigger compensating actions after tool execution.' },
    { icon: Filter, title: 'Data Redaction', description: 'Automatically redact sensitive data from requests and responses based on classification policies.' },
    { icon: Layers, title: 'Multi-Protocol', description: 'Support for HTTP, gRPC, MCP, WebSocket, and custom protocols via pluggable adapters.' },
    { icon: Activity, title: 'Circuit Breaker', description: 'Automatic circuit breaking when tools fail or risk thresholds are exceeded.' },
    { icon: Settings, title: 'Configuration API', description: 'Dynamic configuration updates without restarts. Route-level policy overrides.' },
    { icon: AlertTriangle, title: 'Alert Integration', description: 'Real-time alerts to Slack, PagerDuty, or webhooks when policy violations occur.' },
    { icon: Radio, title: 'Sidecar Mode', description: 'Deploy as a sidecar container alongside your agents for zero-config interception.' },
  ],

  architecture: {
    description: 'The Runtime Interceptor operates as a transparent proxy between agent processes and tool endpoints, enriching each request with governance context.',
    layers: [
      { label: 'Ingress', items: ['Agent SDK Hook', 'Sidecar Proxy', 'Gateway Endpoint', 'MCP Adapter'] },
      { label: 'Processing Pipeline', items: ['Identity Resolver', 'Policy Evaluator', 'Risk Scorer', 'Taint Checker'] },
      { label: 'Enforcement', items: ['Allow/Deny Gate', 'Approval Router', 'Data Redactor', 'Request Transformer'] },
      { label: 'Egress', items: ['Tool Invoker', 'Response Validator', 'Evidence Writer', 'Metrics Emitter'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Request intercepted', description: 'Agent\'s tool invocation is captured by the interceptor before reaching the tool.' },
      { label: 'Context enriched', description: 'Request is enriched with identity, tenant, and historical context.' },
      { label: 'Pipeline evaluated', description: 'Policy, risk, and taint checks execute in parallel within the processing pipeline.' },
      { label: 'Decision made', description: 'Allow, deny, or route-to-approval decision is computed from pipeline results.' },
      { label: 'Request forwarded', description: 'Approved requests are forwarded to the tool with any necessary transformations.' },
      { label: 'Response validated', description: 'Tool response is inspected, logged, and returned to the agent.' },
    ],
  },

  codeExample: {
    title: 'interceptor-config.yaml',
    language: 'yaml',
    code: `# AegisGuard Runtime Interceptor Configuration
interceptor:
  mode: "sidecar"
  listen_port: 8443
  upstream_timeout: "30s"
  max_concurrent: 10000

pipeline:
  pre_execution:
    - identity_resolution
    - policy_evaluation
    - risk_scoring
    - taint_checking
    - approval_check

  post_execution:
    - response_validation
    - data_redaction
    - evidence_writing

enforcement:
  default_action: "deny"
  on_error: "fail_closed"
  circuit_breaker:
    threshold: 5
    reset_after: "30s"

redaction:
  patterns:
    - type: "pii"
      action: "mask"
    - type: "secrets"
      action: "remove"`,
  },

  faq: [
    { question: 'What is the performance overhead?', answer: 'Typical overhead is under 1ms per request. The pipeline uses parallel evaluation and pre-compiled policies to minimize latency. P99 latency is consistently under 2ms.' },
    { question: 'Does it work with my existing agent framework?', answer: 'Yes. The interceptor supports sidecar, gateway, and SDK integration modes. It works with LangChain, AutoGen, CrewAI, and any framework that makes HTTP or MCP tool calls.' },
    { question: 'What happens if the interceptor goes down?', answer: 'Configurable fail-open or fail-closed behavior. In fail-closed mode, all requests are denied. High-availability deployment supports active-active redundancy.' },
    { question: 'Can I deploy it without modifying agent code?', answer: 'Yes. In sidecar or gateway mode, the interceptor operates transparently. No code changes required. Agents communicate with the interceptor as if it were the tool endpoint.' },
  ],
};

export default function RuntimeInterceptor() {
  return <FeaturePageTemplate data={data} />;
}
