import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Sensitive Data Protection for AI Agents — Taint Tracking & DLP | Runwall',
  description: 'How Runwall prevents AI agents from leaking sensitive data through taint tracking, session-level DLP, and data flow governance across MCP tool calls.',
  path: '/use-cases/sensitive-data',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Use Cases', href: 'https://runwall.in/use-cases/sensitive-data' },
    { name: 'Sensitive Data', href: 'https://runwall.in/use-cases/sensitive-data' },
  ],
  content: [
    'AI agents working with sensitive data — customer records, financial information, PII, API credentials, internal documents — pose a data exfiltration risk that traditional DLP solutions are not designed to handle. An agent can read sensitive records from a database, reason about them, summarize them, and then write that summary to a Slack channel, an external API, or a file accessible to other users — constituting a data leak even though each individual operation appears benign.',
    'Runwall\'s taint tracking provides session-level data flow governance specifically designed for this scenario. When an agent reads from a source classified as sensitive, the session is flagged as tainted. All subsequent write operations in that session are restricted by policy — preventing the agent from forwarding, summarizing, or otherwise exfiltrating sensitive data to unauthorized destinations, even if the data has been reformulated by the agent.',
  ],
  sections: [
    {
      heading: 'Why Traditional DLP Fails for Agents',
      body: 'Traditional DLP solutions look for specific patterns (credit card numbers, SSNs, API keys) in data leaving the network. AI agents break this model because they transform data: an agent that reads a database of customer records and writes "there are 47 customers in California" has exfiltrated PII-derived information without any detectable PII pattern in the output. Runwall\'s session-level taint tracking catches this by restricting all downstream writes after sensitive data is read, regardless of how the data is transformed.',
    },
  ],
  faqs: [
    {
      question: 'How does Runwall prevent AI agents from leaking sensitive data?',
      answer: 'Runwall\'s taint tracking flags sessions where an agent has read sensitive data. Once a session is tainted, all downstream write operations are restricted by policy — preventing the agent from forwarding, summarizing, or reformulating sensitive data to unauthorized destinations. This works even when the agent transforms the data beyond pattern-matching detection.',
    },
    {
      question: 'Can Runwall detect when an agent has access to PII?',
      answer: 'Runwall tracks data flow at the session level based on the sources the agent reads from. If an agent reads from a source classified as sensitive (a database containing PII, a document marked confidential, an API returning customer data), the session is tainted. The classification is source-based, not content-based, which is more reliable for agent workflows.',
    },
    {
      question: 'Does Runwall replace traditional DLP tools?',
      answer: 'Runwall complements traditional DLP rather than replacing it. Traditional DLP is effective for known patterns (credit card numbers, API keys) in structured data flows. Runwall adds agent-specific data flow governance that handles the unique challenge of LLM agents that transform, summarize, and redistribute data in ways that evade pattern-matching detection.',
    },
  ],
  relatedLinks: [
    { label: 'Taint Tracking Documentation', to: '/docs/taint' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'AI Agent Security (Pillar)', to: '/ai-agent-security' },
  ],
};

export default function UseCasesSensitiveData() {
  return <GeoPageTemplate data={data} />;
}
