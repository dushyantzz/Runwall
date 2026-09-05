import GeoPageTemplate from '../../../components/GeoPageTemplate';
import type { GeoPageData } from '../../../components/GeoPageTemplate';

const data: GeoPageData = {
  title: 'OPA/Rego Policy Engine — Runwall Docs',
  description: 'Documentation for Runwall\'s Policy Engine powered by Open Policy Agent (OPA). Write and deploy Rego policies for fine-grained, per-tool-call governance of AI agents.',
  path: '/docs/policies',
  breadcrumbs: [
    { name: 'Home', href: 'https://runwall.in/' },
    { name: 'Docs', href: 'https://runwall.in/docs' },
    { name: 'Policies', href: 'https://runwall.in/docs/policies' },
  ],
  content: [
    'Runwall\'s Policy Engine evaluates every agent tool call against declarative OPA/Rego policies before execution. Policies define what actions are allowed, denied, or require approval based on attributes like the agent identity, tool name, parameter values, session taint state, risk score, and tenant context. This allows security and platform teams to express complex governance rules without modifying agent code.',
    'Policies are versioned, hot-reloadable, and support dry-run mode. You can deploy a new policy in shadow mode to evaluate it against live traffic without enforcing it, review the results, and then promote it to enforcement. The fail-closed model ensures that if policy evaluation fails for any reason, the default action is deny.',
  ],
  codeSnippet: {
    title: 'Example Rego Policy — Restrict File Writes by Taint',
    language: 'rego',
    code: `package runwall.policies

# Deny file write operations when the session is tainted
# (agent has ingested untrusted input)
deny[msg] {
    input.tool_name == "write_file"
    input.session.taint_state == "tainted"
    msg := sprintf(
        "Blocked: write_file denied for tainted session %s. "
        "Agent ingested untrusted input — downstream writes restricted.",
        [input.session.session_id]
    )
}

# Require approval for terminal commands with elevated risk
approval_required {
    input.tool_name == "execute_command"
    input.risk_score > 0.7
}

# Allow read operations unconditionally
allow {
    startswith(input.tool_name, "read_")
}`,
  },
  faqs: [
    {
      question: 'What policy language does Runwall use?',
      answer: 'Runwall\'s Policy Engine uses Rego, the policy language for Open Policy Agent (OPA). Rego is a declarative language purpose-built for expressing access control and governance rules across attributes like identity, resource type, action parameters, and environmental context.',
    },
    {
      question: 'Can I test a policy before enforcing it?',
      answer: 'Yes. Runwall supports dry-run (shadow) mode where a new policy evaluates against live traffic without actually enforcing allow/deny decisions. You can review the simulated results to verify the policy behaves as intended before promoting it to enforcement mode.',
    },
    {
      question: 'What happens if the policy engine crashes or times out?',
      answer: 'Runwall uses a fail-closed model. If policy evaluation fails for any reason — timeout, error, missing policy definition, or malformed input — the default action is deny. This prevents bypass attacks that attempt to crash the policy engine to gain unrestricted access.',
    },
    {
      question: 'Can different tenants have different policies?',
      answer: 'Yes. Policies are scoped per tenant. Each tenant can define their own Rego policy bundles that are evaluated independently. This supports multi-tenant deployments where different organizations have different governance requirements.',
    },
  ],
  relatedLinks: [
    { label: 'Risk Scoring Engine', to: '/docs/risk' },
    { label: 'Taint Tracking Documentation', to: '/docs/taint' },
    { label: 'Approval Workflows', to: '/docs/approvals' },
    { label: 'AI Agent Governance (Pillar)', to: '/ai-agent-governance' },
  ],
};

export default function DocsPolicies() {
  return <GeoPageTemplate data={data} />;
}
