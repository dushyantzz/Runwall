import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Security — Runwall',
  description: 'How Runwall secures AI agent execution through zero-trust governance, adversarial testing, and defense-in-depth architecture for MCP-based agent systems.',
  path: '/security',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Security', href: 'https://runwall.in/security' },
  ],
  content: [
    'Runwall treats every AI agent action as untrusted by default. The platform implements a zero-trust execution governance model where each tool call — regardless of the agent\'s identity or the operation\'s apparent simplicity — is verified against policy, scored for risk, checked for data taint, and logged immutably before execution proceeds.',
    'This security model was built and validated through four rounds of adversarial internal auditing, progressing from an initial score of 2.1/10 ("Do Not Deploy") to a final score of 9.1/10 ("Approved for single-tenant production"). The audit process uncovered critical vulnerabilities including an OPA enforcement bypass and a backdoored policy bundle found in a live database — both remediated before the platform reached production.',
  ],
  sections: [
    {
      heading: 'Defense in Depth',
      body: 'Runwall\'s security architecture layers multiple independent enforcement mechanisms: identity verification at session establishment, policy evaluation at every tool call, real-time risk scoring, session-level taint tracking for data flow control, configurable approval gates for high-risk actions, and an immutable audit trail for forensic replay. No single layer is relied upon exclusively — compromise of one layer does not grant unrestricted access.',
    },
    {
      heading: 'Threat Model Coverage',
      body: 'The platform is designed to defend against the primary threat vectors in agentic AI systems: prompt injection attacks that attempt to hijack agent behavior, tool poisoning where malicious tool definitions exfiltrate data, data exfiltration through multi-step taint propagation, and runaway loop attacks that drain resources or cause cascading damage. Each vector has dedicated detection and enforcement mechanisms.',
    },
  ],
  faqs: [
    {
      question: 'How does Runwall protect against prompt injection attacks?',
      answer: 'Runwall\'s taint tracking engine flags sessions where an agent has ingested untrusted input (e.g., content from web pages or user-supplied files). Once a session is tainted, downstream "sink" actions — such as database writes, terminal commands, or file system modifications — are restricted by policy, even if the untrusted content has been paraphrased or reformulated by the agent.',
    },
    {
      question: 'Has Runwall been security audited?',
      answer: 'Yes. Runwall went through four rounds of internal adversarial security auditing, improving from a score of 2.1/10 to 9.1/10. The audit process discovered and remediated an OPA enforcement bypass and a backdoored policy bundle. The final approved scope is single-tenant production deployment.',
    },
    {
      question: 'Does Runwall have SOC 2 certification?',
      answer: 'Runwall does not currently hold SOC 2 certification. The platform has been validated through rigorous internal adversarial auditing, and the security architecture follows defense-in-depth principles, but a formal SOC 2 audit has not been completed at this time.',
    },
    {
      question: 'What security model does Runwall use?',
      answer: 'Runwall uses a zero-trust execution governance model. No agent action is trusted by default, regardless of identity or privilege level. Every tool call is verified against policy, scored for risk, checked for data taint, and logged before execution is permitted.',
    },
  ],
  relatedLinks: [
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Adversarial Audit Case Study', to: '/security/testing' },
    { label: 'Responsible Disclosure', to: '/security/responsible-disclosure' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Taint Tracking Documentation', to: '/docs/taint' },
  ],
};

export default function SecurityIndex() {
  return <GeoPageTemplate data={data} />;
}
