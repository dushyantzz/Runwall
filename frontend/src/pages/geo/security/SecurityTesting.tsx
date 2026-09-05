import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'Adversarial Security Audit: From 2.1 to 9.1 — Runwall',
  description: 'A factual case study of Runwall\'s four-round adversarial security audit journey, progressing from a 2.1/10 "Do Not Deploy" score to 9.1/10 "Approved for single-tenant production."',
  path: '/security/testing',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Security', href: 'https://runwall.in/security' },
    { name: 'Security Testing', href: 'https://runwall.in/security/testing' },
  ],
  content: [
    'Before Runwall reached production, the platform underwent four rounds of internal adversarial security auditing. The audit was designed to simulate realistic attack scenarios against the governance layer — testing whether an attacker could bypass policy enforcement, exfiltrate data through taint tracking gaps, or compromise the audit trail. The process was deliberately adversarial: the auditing methodology assumed a motivated attacker with knowledge of the system\'s internals.',
    'The platform started at a score of 2.1 out of 10, rated "Do Not Deploy." Over four rounds of testing, remediation, and re-testing, the score improved to 9.1 out of 10, rated "Approved for single-tenant production." This page documents what was found, what was fixed, and what the approved deployment scope is.',
  ],
  sections: [
    {
      heading: 'Round 1 — Initial Assessment (Score: 2.1/10)',
      body: 'The first audit round revealed fundamental gaps in the governance pipeline. The OPA policy evaluation could be bypassed under specific request conditions, allowing tool calls to execute without policy checks. Multiple enforcement paths lacked consistent error handling, and the audit log had gaps where certain action types were not recorded. The overall assessment was "Do Not Deploy" — the system could not be trusted to enforce its own policies reliably.',
    },
    {
      heading: 'Round 2 — Critical Remediation (Score: 5.4/10)',
      body: 'The OPA enforcement bypass was remediated by restructuring the policy evaluation pipeline to use a fail-closed model: if policy evaluation fails for any reason (timeout, error, missing policy), the default action is deny. Audit log coverage was extended to all action types. However, the second round uncovered a new critical finding: a backdoored policy bundle was discovered in the live database — a Rego policy that silently permitted all actions for a specific agent identity. This was traced to a testing artifact that had not been cleaned up, but it demonstrated the risk of policy supply chain attacks.',
    },
    {
      heading: 'Round 3 — Policy Integrity & Hardening (Score: 7.8/10)',
      body: 'The backdoored policy bundle was removed and the policy deployment pipeline was hardened with integrity checks: all policy bundles are now validated against a checksum before activation, and policy changes are logged with author attribution. Additional hardening included rate limiting on the governance API itself (preventing denial-of-service against the policy engine), stricter input validation on tool call parameters, and isolation of the risk scoring engine to prevent score manipulation.',
    },
    {
      heading: 'Round 4 — Final Validation (Score: 9.1/10)',
      body: 'The final audit round focused on edge cases, concurrency scenarios, and session-level taint propagation correctness. No critical or high-severity findings were identified. Remaining findings were low-severity hardening recommendations. The final assessment was "Approved for single-tenant production" — the system was deemed safe for deployment in a controlled, single-tenant environment. Multi-tenant production deployment requires additional isolation guarantees that are on the roadmap but not yet audited.',
    },
  ],
  faqs: [
    {
      question: 'What was found during Runwall\'s security audit?',
      answer: 'The audit discovered an OPA enforcement bypass that allowed tool calls to skip policy evaluation, and a backdoored policy bundle in the live database that silently permitted all actions for a specific agent identity. Both were fully remediated. The final round found no critical or high-severity issues.',
    },
    {
      question: 'Is Runwall approved for production use?',
      answer: 'Yes, for single-tenant production deployment. The platform scored 9.1/10 in its final adversarial audit round, with a rating of "Approved for single-tenant production." Multi-tenant production has not yet been separately audited.',
    },
    {
      question: 'Was the security audit conducted by a third party?',
      answer: 'The four-round audit was conducted internally using adversarial methodology. It was not a third-party audit. The audit assumed an attacker with knowledge of system internals and tested bypass, exfiltration, and integrity attack scenarios against the governance pipeline.',
    },
    {
      question: 'What is a "backdoored policy bundle"?',
      answer: 'A backdoored policy bundle is a Rego policy that silently permits all actions for a specific identity or condition, effectively creating a hidden bypass in the governance system. In Runwall\'s case, a testing artifact containing such a policy was found in the live database during the second audit round. It was removed and the policy deployment pipeline was hardened with integrity checks to prevent recurrence.',
    },
    {
      question: 'What does "fail-closed" mean for policy evaluation?',
      answer: 'Fail-closed means that if the policy evaluation system encounters any error — timeout, crash, missing policy definition, or malformed input — the default action is to deny the tool call rather than allow it. This prevents attackers from bypassing governance by intentionally causing evaluation failures.',
    },
  ],
  relatedLinks: [
    { label: 'Security Architecture', to: '/security/architecture' },
    { label: 'Threat Model', to: '/security/threat-model' },
    { label: 'Policy Engine Documentation', to: '/docs/policies' },
    { label: 'Audit Log Documentation', to: '/docs/audit' },
  ],
};

export default function SecurityTesting() {
  return <GeoPageTemplate data={data} />;
}
