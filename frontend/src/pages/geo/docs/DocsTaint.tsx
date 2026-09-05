import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Taint Tracking & DLP for AI Agents — Runwall Docs',
  description: 'Documentation for Runwall\'s session-level Taint Tracking Engine. How taint flags propagate when an agent ingests untrusted input, restricting downstream sink actions.',
  path: '/docs/taint',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'Taint Tracking', href: 'https://runwall.in/docs/taint' },
  ],
  content: [
    'Runwall\'s Taint Tracking Engine monitors data flow at the session level to prevent AI agents from leaking sensitive data or acting on untrusted input. The system does not perform literal string matching — instead, it tracks taint as a session-level flag. When an agent ingests content from an untrusted source (e.g., a web page, user-uploaded file, or external API), the entire session is flagged as tainted. Once tainted, downstream "sink" actions — database writes, terminal commands, file modifications, external API calls — are restricted by policy.',
    'This session-level model is designed to handle the fundamental challenge of prompt injection defense: an agent that ingests adversarial input will reformulate, paraphrase, and mix the injected content with its own reasoning. Literal string tracking would miss these transformations. Taint tracking at the session level ensures that once untrusted input enters the agent\'s context, all subsequent actions are governed under tainted-session policy — regardless of how the content is transformed.',
  ],
  sections: [
    {
      heading: 'Taint Sources and Sinks',
      body: 'Sources are operations that ingest external or untrusted data: reading web pages, processing user-uploaded files, calling external APIs, or receiving messages from untrusted channels. Sinks are operations that have real-world consequences: writing to databases, executing terminal commands, modifying files, sending emails, or calling external APIs with sensitive data. When a tainted session attempts a sink action, policy determines the response: block, require approval, or log-and-allow.',
    },
    {
      heading: 'Session-Level vs. String-Level Tracking',
      body: 'Runwall deliberately uses session-level taint flags rather than attempting to track individual strings or tokens through an agent\'s context. The reason: LLM agents do not preserve data boundaries. An agent that reads a malicious web page will mix that content with its own reasoning, paraphrase it, summarize it, and distribute fragments across multiple tool calls. String-level tracking cannot follow these transformations reliably. Session-level tracking accepts this reality and restricts all downstream actions once any untrusted input enters the session.',
    },
  ],
  codeSnippet: {
    title: 'Taint-Aware Policy Example',
    language: 'rego',
    code: `package runwall.taint_policy

# Block all write operations in tainted sessions
deny[msg] {
    input.session.taint_state == "tainted"
    input.action_type == "write"
    msg := sprintf(
        "Blocked: %s denied in tainted session %s. "
        "Session tainted by source: %s",
        [input.tool_name, input.session.session_id,
         input.session.taint_source]
    )
}

# Allow reads even in tainted sessions (read-only is safe)
allow {
    input.session.taint_state == "tainted"
    input.action_type == "read"
}`,
  },
  faqs: [
    {
      question: 'What is taint tracking in Runwall?',
      answer: 'Taint tracking monitors data flow at the session level. When an AI agent ingests untrusted input (like a web page or user-uploaded file), the session is flagged as "tainted." Once tainted, downstream sink actions — writes, deletes, terminal commands — are restricted by policy, even if the untrusted content has been paraphrased by the agent.',
    },
    {
      question: 'Why does Runwall use session-level taint tracking instead of string matching?',
      answer: 'LLM agents do not preserve data boundaries. An agent that ingests adversarial content will reformulate, paraphrase, and mix it with its own reasoning across multiple tool calls. String-level tracking cannot follow these transformations. Session-level tracking accepts this and restricts all downstream actions once untrusted input enters the session context.',
    },
    {
      question: 'Can I configure which sources trigger taint flags?',
      answer: 'Yes. Taint sources are configurable through the policy engine. You can define which tool types or data origins are classified as untrusted sources, and which downstream actions are classified as restricted sinks. This allows you to tune the sensitivity based on your security requirements.',
    },
    {
      question: 'Does taint tracking work across multi-step agent workflows?',
      answer: 'Yes. Taint is a session-level flag that persists across all tool calls within the same agent session. If an agent ingests untrusted input in step 1 and attempts a database write in step 15, the taint flag is still active and the write is governed by tainted-session policy.',
    },
  ],
  relatedLinks: [
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Sensitive Data Use Case', to: '/use-cases/sensitive-data' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'AI Agent Security (Pillar)', to: '/ai-agent-security' },
  ],
};

export default function DocsTaint() {
  return <GeoPageTemplate data={data} />;
}
