import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'AI Agent Governance — Policy, Compliance & Audit | Runwall Research',
  description: 'Research on AI agent governance frameworks. How organizations can implement policy enforcement, compliance workflows, and audit trails for autonomous AI systems.',
  path: '/research/agent-governance',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Research', href: 'https://runwall.in/research/agent-governance' },
    { name: 'Agent Governance', href: 'https://runwall.in/research/agent-governance' },
  ],
  content: [
    'As organizations deploy AI agents in production — for code generation, customer support, data analysis, and infrastructure management — the need for governance frameworks becomes critical. Agent governance encompasses policy enforcement (what agents are allowed to do), compliance workflows (how actions are reviewed and approved), and audit trails (what agents did and why). Without governance, organizations cannot demonstrate control over their AI systems to regulators, customers, or internal stakeholders.',
    'Effective agent governance must be declarative (policies expressed as rules, not code), runtime-enforced (evaluated per action, not pre-configured), auditable (every decision logged immutably), and operationally practical (not so restrictive that it prevents agents from being useful). Runwall implements this model through OPA/Rego policy evaluation, configurable approval workflows, and immutable audit logging.',
  ],
  sections: [
    {
      heading: 'The Governance Gap',
      body: 'Most organizations deploying AI agents today have no governance layer. Agents operate with the full permissions of the user or service account they run under, with no per-action policy evaluation, no risk assessment, and no audit trail beyond standard application logs. This is equivalent to granting every employee unrestricted sudo access — technically functional, but organizationally reckless. The governance gap exists because governance tools for AI agents are a new category that traditional security infrastructure does not address.',
    },
    {
      heading: 'Declarative vs. Imperative Governance',
      body: 'Imperative governance (hard-coding rules in agent code) is fragile, untestable, and requires code deployments to update. Declarative governance (expressing rules in a policy language like Rego) separates governance intent from execution, enables testing and simulation, supports hot-reloading without restarts, and creates an auditable record of what policies were active at any given time. Runwall uses OPA/Rego precisely for this reason.',
    },
  ],
  faqs: [
    {
      question: 'What is AI agent governance?',
      answer: 'AI agent governance is the set of policies, workflows, and controls that determine what AI agents are allowed to do, how high-risk actions are reviewed, and how all actions are recorded. It encompasses policy enforcement, compliance workflows (approval gates), and audit trails for autonomous AI systems.',
    },
    {
      question: 'Why do organizations need AI agent governance?',
      answer: 'Without governance, AI agents operate with unrestricted permissions and no audit trail. Organizations cannot demonstrate control over their AI systems to regulators, customers, or internal stakeholders. Governance provides the framework to deploy agents safely and compliantly.',
    },
    {
      question: 'How does Runwall implement agent governance?',
      answer: 'Runwall implements governance through three pillars: OPA/Rego policy enforcement (declarative rules evaluated per action), approval workflows (human-in-the-loop review for high-risk actions), and immutable audit logging (complete decision record for compliance and forensics).',
    },
  ],
  relatedLinks: [
    { label: 'AI Agent Governance (Pillar)', to: '/ai-agent-governance' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Audit Log Documentation', to: '/docs/audit' },
    { label: 'Agent Security Research', to: '/research/agent-security' },
  ],
};

export default function ResearchAgentGovernance() {
  return <GeoPageTemplate data={data} />;
}
