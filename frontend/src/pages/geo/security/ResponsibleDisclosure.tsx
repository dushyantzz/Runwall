import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Responsible Disclosure — Runwall',
  description: 'Runwall\'s responsible disclosure policy for reporting security vulnerabilities in the execution governance platform.',
  path: '/security/responsible-disclosure',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Security', href: 'https://runwall.in/security' },
    { name: 'Responsible Disclosure', href: 'https://runwall.in/security/responsible-disclosure' },
  ],
  content: [
    'Runwall takes the security of its execution governance platform seriously. If you discover a security vulnerability in Runwall — whether in the policy engine, risk scoring, taint tracking, audit system, MCP protocol broker, or any other component — we encourage you to report it responsibly so we can investigate and address it before it can be exploited.',
    'We are committed to working with security researchers and the broader community to keep the platform and its users safe. We will not take legal action against researchers who report vulnerabilities in good faith, follow this disclosure policy, and avoid accessing or modifying other users\' data.',
  ],
  sections: [
    {
      heading: 'How to Report',
      body: 'Send vulnerability reports to dushyantkv508@gmail.com with the subject line "Security Vulnerability Report." Include a clear description of the vulnerability, steps to reproduce it, the potential impact, and any proof-of-concept code or screenshots. Please do not publicly disclose the vulnerability until we have had a reasonable opportunity to investigate and remediate.',
    },
    {
      heading: 'What to Expect',
      body: 'We will acknowledge receipt of your report within 72 hours. We will provide an initial assessment and estimated timeline for remediation within 7 business days. We will keep you informed of our progress and notify you when the vulnerability has been fixed. We will credit you in any public disclosure (unless you prefer to remain anonymous).',
    },
    {
      heading: 'Scope',
      body: 'The following components are in scope for vulnerability reports: the Runwall governance proxy (policy evaluation, risk scoring, taint tracking, approval workflows, audit logging), the MCP Protocol Broker, the API and authentication layer, the web application at runwall.in, and the @runwall/mcp npm package. Out of scope: social engineering attacks, denial-of-service attacks against production infrastructure, and findings on third-party services not operated by Runwall.',
    },
  ],
  faqs: [
    {
      question: 'How do I report a security vulnerability in Runwall?',
      answer: 'Email dushyantkv508@gmail.com with the subject "Security Vulnerability Report." Include a description, reproduction steps, potential impact, and any proof-of-concept material. Do not publicly disclose the vulnerability until it has been remediated.',
    },
    {
      question: 'Does Runwall have a bug bounty program?',
      answer: 'Runwall does not currently operate a formal bug bounty program. We do, however, acknowledge and credit security researchers who responsibly disclose vulnerabilities, and we are committed to prompt remediation of confirmed issues.',
    },
    {
      question: 'Will I be credited for reporting a vulnerability?',
      answer: 'Yes, unless you prefer to remain anonymous. Researchers who responsibly disclose valid security vulnerabilities will be credited in any public disclosure or advisory related to the finding.',
    },
  ],
  relatedLinks: [
    { label: 'Security Overview', to: '/security' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'Adversarial Audit Case Study', to: '/security/testing' },
  ],
};

export default function ResponsibleDisclosure() {
  return <GeoPageTemplate data={data} />;
}
