import { Fingerprint, ShieldCheck, Key, Users, Lock, Scan, FileKey, UserCheck, KeyRound } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Fingerprint,
  title: 'Identity & Access Control',
  subtitle: 'Establish cryptographic agent identity, enforce authentication at every boundary, and scope permissions through role-based access control — before any tool is invoked.',
  badgeText: 'Identity Layer',

  problem: {
    heading: 'Agents operate without verified identity',
    description: 'Most AI agent frameworks treat identity as an afterthought. Agents share credentials, escalate privileges silently, and execute tools without any authentication boundary.',
    points: [
      'Agents share API keys with no individual accountability',
      'No distinction between human-initiated and autonomous actions',
      'Privilege escalation goes undetected across tool chains',
      'Credential rotation requires manual intervention and downtime',
      'No audit trail links actions back to specific agent identities',
    ],
  },

  whatItDoes: {
    heading: 'Cryptographic identity for every agent',
    description: 'AegisGuard assigns and verifies unique identities for every agent, user, and service — enforcing authentication and authorization at every execution boundary.',
    points: [
      'JWT and API key-based agent authentication',
      'Per-agent identity with unique cryptographic fingerprints',
      'Role-based access control (RBAC) for tool scoping',
      'Attribute-based access control (ABAC) for dynamic policies',
      'Automatic credential rotation and lifecycle management',
      'Session-scoped tokens with configurable TTL',
      'Multi-factor verification for high-risk operations',
      'Cross-tenant identity federation',
    ],
  },

  whyItMatters: {
    heading: 'Why identity matters for AI agents',
    description: 'Without verified identity, every audit is meaningless, every policy is bypassable, and every compliance report is incomplete.',
    benefits: [
      { title: 'Accountability', description: 'Every action is tied to a verified identity. No more shared credentials or anonymous agent execution.' },
      { title: 'Least Privilege', description: 'Agents only access what they need. RBAC and ABAC ensure minimal attack surface at every boundary.' },
      { title: 'Compliance', description: 'Meet SOC 2, HIPAA, and SOX requirements with cryptographic proof of agent identity and authorization.' },
    ],
  },

  capabilities: [
    { icon: Key, title: 'JWT Authentication', description: 'Issue and verify JSON Web Tokens with configurable claims, scopes, and expiration policies.' },
    { icon: ShieldCheck, title: 'RBAC Engine', description: 'Define roles with fine-grained permissions. Assign agents to roles with inheritance and override support.' },
    { icon: Users, title: 'Identity Federation', description: 'Federate identities across tenants, SSO providers, and external identity platforms.' },
    { icon: Lock, title: 'Credential Vault', description: 'Secure storage for API keys, tokens, and secrets with automatic rotation schedules.' },
    { icon: Scan, title: 'Biometric Fingerprints', description: 'Unique cryptographic fingerprints for each agent instance, verified at every execution boundary.' },
    { icon: FileKey, title: 'Policy Binding', description: 'Bind identity attributes directly to policy evaluation context for dynamic authorization.' },
    { icon: UserCheck, title: 'Session Management', description: 'Scoped sessions with configurable TTL, refresh tokens, and forced revocation capabilities.' },
    { icon: KeyRound, title: 'Key Rotation', description: 'Automatic key rotation with zero-downtime rollover and backward-compatible verification.' },
    { icon: Fingerprint, title: 'Audit Integration', description: 'Every identity event — creation, authentication, authorization — is recorded in the immutable audit log.' },
  ],

  architecture: {
    description: 'The Identity & Access Control module sits at the entry point of every agent request, resolving identity before any policy evaluation occurs.',
    layers: [
      { label: 'Client Layer', items: ['Agent SDK', 'API Gateway', 'CLI Tools'] },
      { label: 'Authentication', items: ['JWT Verifier', 'API Key Validator', 'SSO Bridge', 'MFA Handler'] },
      { label: 'Authorization', items: ['RBAC Engine', 'ABAC Evaluator', 'Scope Resolver', 'Policy Binder'] },
      { label: 'Identity Store', items: ['Agent Registry', 'Credential Vault', 'Key Rotation Service', 'Federation Bridge'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Agent presents credentials', description: 'JWT token or API key is submitted with the execution request.' },
      { label: 'Token verification', description: 'Cryptographic signature is validated, claims are extracted, and expiration is checked.' },
      { label: 'Identity resolution', description: 'Agent identity is resolved from the token, linked to the registered agent profile.' },
      { label: 'Role lookup', description: 'Assigned roles and permissions are loaded from the RBAC configuration.' },
      { label: 'Scope evaluation', description: 'Requested action is checked against the agent\'s permitted tool scopes.' },
      { label: 'Context injection', description: 'Identity attributes are injected into the policy evaluation context for downstream checks.' },
    ],
  },

  codeExample: {
    title: 'identity-policy.yaml',
    language: 'yaml',
    code: `# AegisGuard Identity & Access Control Configuration
identity:
  provider: "jwt"
  issuer: "https://auth.aegisguard.io"
  audience: "aegisguard-platform"
  token_ttl: "1h"
  refresh_enabled: true

roles:
  - name: "agent-reader"
    permissions:
      - "tools:read"
      - "data:query"
    max_risk_score: 0.5

  - name: "agent-writer"
    permissions:
      - "tools:read"
      - "tools:execute"
      - "data:write"
    requires_approval: true
    max_risk_score: 0.3

credentials:
  rotation:
    enabled: true
    interval: "24h"
    overlap: "1h"`,
  },

  faq: [
    { question: 'Can I use existing identity providers like Okta or Auth0?', answer: 'Yes. AegisGuard supports OIDC and SAML federation, allowing you to use existing identity providers. Agent identities are mapped to your IdP through configurable claims mapping.' },
    { question: 'How does identity work for autonomous agents?', answer: 'Each autonomous agent receives a unique cryptographic identity with scoped credentials. These are managed through the Agent Registry and support automatic rotation without human intervention.' },
    { question: 'What happens when an agent\'s credentials expire?', answer: 'Expired tokens are rejected at the authentication boundary. Agents with refresh tokens can automatically obtain new credentials. Forced revocation immediately invalidates all active sessions.' },
    { question: 'Can I scope different permissions per environment?', answer: 'Yes. Roles and permissions can be scoped by environment (dev, staging, production) with separate credential stores and policy bindings for each.' },
  ],
};

export default function IdentityAccessControl() {
  return <FeaturePageTemplate data={data} />;
}
