import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Governance for Autonomous AI Agents — Loop Protection & Rate Limits | Runwall',
  description: 'How Runwall protects against runaway AI agent loops with rate limits, quotas, rollback capabilities, and resource governance for autonomous agent systems.',
  path: '/use-cases/autonomous-agents',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Use Cases', href: 'https://runwall.in/use-cases/autonomous-agents' },
    { name: 'Autonomous Agents', href: 'https://runwall.in/use-cases/autonomous-agents' },
  ],
  content: [
    'Autonomous AI agents operate with minimal human oversight, executing multi-step workflows that can span hundreds of tool calls. This autonomy creates a unique governance challenge: a logic error, adversarial prompt, or unexpected edge case can cause an agent to enter a runaway loop — executing thousands of API calls, draining budgets, overloading downstream systems, or causing cascading damage through repeated destructive operations.',
    'Runwall provides runtime guardrails for autonomous agents through rate limits, quotas, rollback capabilities, and real-time risk monitoring. Rate limits cap the number of tool calls per time window at the per-agent, per-tool, and per-tenant level. Rollback and compensating actions can automatically revert state changes when an agent\'s workflow fails or violates policy mid-execution. These mechanisms ensure that autonomous agents can operate at speed while bounded by governance constraints.',
  ],
  sections: [
    {
      heading: 'Rate Limits & Quotas',
      body: 'Runwall enforces configurable rate limits at multiple granularity levels: per-agent session, per-tool, per-tenant, and globally. When an agent exceeds its allowed call rate, further invocations are hard-blocked and the event is logged. Quotas track cumulative resource usage (total tool calls, execution time, API costs) and can trigger throttling or shutdown when budgets are exceeded.',
    },
    {
      heading: 'Rollback & Compensating Actions',
      body: 'When an autonomous agent\'s workflow fails mid-execution or a policy violation is detected after a write operation has completed, Runwall can trigger compensating actions to revert the state change. This is implemented through a reversible execution log that records the inverse operation for each modifying action. Rollback can be triggered automatically by policy or manually through the governance API.',
    },
  ],
  faqs: [
    {
      question: 'How does Runwall prevent AI agent infinite loops?',
      answer: 'Runwall enforces per-agent, per-tool rate limits that cap the number of tool calls within configurable time windows. If an agent enters a loop and exceeds its rate limit, further tool calls are hard-blocked. Quotas also track cumulative usage and can shut down runaway sessions when resource budgets are exceeded.',
    },
    {
      question: 'Can Runwall roll back actions taken by an AI agent?',
      answer: 'Yes. Runwall\'s rollback system records compensating actions for modifying operations. If an agent\'s workflow fails mid-execution or a policy violation is detected after a write completes, compensating actions can revert the state change. Rollback can be triggered automatically by policy or manually by an administrator.',
    },
    {
      question: 'What are quotas in Runwall?',
      answer: 'Quotas track cumulative resource usage across an agent session, tenant, or time period. They can measure total tool calls, cumulative execution time, API costs, or custom metrics. When a quota is exceeded, Runwall can throttle, block, or alert — preventing budget overruns and resource abuse.',
    },
    {
      question: 'Does Runwall work with multi-agent pipelines?',
      answer: 'Yes. Runwall supports M2M (machine-to-machine) verification for multi-agent pipelines where agents communicate and delegate tasks to each other. Each agent in the pipeline is independently authenticated and governed, with rate limits and policies applied per agent.',
    },
  ],
  relatedLinks: [
    { label: 'Risk Scoring Documentation', to: '/docs/risk' },
    { label: 'Enterprise MCP Use Case', to: '/use-cases/enterprise-mcp' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Runwall vs. Agent Observability Tools', to: '/compare/agent-observability' },
  ],
};

export default function UseCasesAutonomousAgents() {
  return <GeoPageTemplate data={data} />;
}
