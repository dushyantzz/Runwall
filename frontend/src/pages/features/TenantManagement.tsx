import { Building2, Users, Shield, Globe, Layers, Settings, Lock, Network, GitBranch } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Building2,
  title: 'Tenant & Organization Management',
  subtitle: 'Complete multi-tenant isolation with hierarchical organization structures, cross-tenant policy inheritance, and granular resource boundaries for every agent deployment.',
  badgeText: 'Multi-Tenancy',

  problem: {
    heading: 'AI agents blur organizational boundaries',
    description: 'As enterprises scale agent deployments across teams and business units, maintaining strict isolation between tenants becomes critical — and nearly impossible without purpose-built infrastructure.',
    points: [
      'Agents from different teams share the same execution context',
      'Policy changes in one tenant accidentally affect others',
      'No hierarchical organization structure for complex enterprises',
      'Resource quotas cannot be enforced per business unit',
      'Compliance boundaries are violated by cross-tenant data flows',
    ],
  },

  whatItDoes: {
    heading: 'Hierarchical multi-tenancy for agent platforms',
    description: 'Runwall provides complete tenant isolation with organizational hierarchies, enabling enterprises to manage thousands of agents across complex organizational structures.',
    points: [
      'Strict resource isolation between tenants',
      'Hierarchical org structures (org → team → project)',
      'Policy inheritance with override capabilities',
      'Per-tenant quotas and rate limits',
      'Cross-tenant federation for shared services',
      'Tenant-scoped audit trails',
      'Custom branding and configuration per tenant',
      'Automated tenant provisioning via API',
    ],
  },

  whyItMatters: {
    heading: 'Why multi-tenancy matters at scale',
    description: 'Enterprise AI deployments require the same isolation guarantees that cloud platforms provide — applied to the agent execution layer.',
    benefits: [
      { title: 'Data Isolation', description: 'Cryptographic boundaries ensure no tenant can access another\'s data, policies, or execution context.' },
      { title: 'Policy Autonomy', description: 'Each team defines their own governance policies while inheriting organizational baselines.' },
      { title: 'Cost Attribution', description: 'Track and allocate costs per tenant, team, or project with granular usage metering.' },
    ],
  },

  capabilities: [
    { icon: Building2, title: 'Org Hierarchies', description: 'Define multi-level organizational structures with inheritance at every level.' },
    { icon: Users, title: 'Team Management', description: 'Create and manage teams with role assignments, member invitations, and access policies.' },
    { icon: Shield, title: 'Tenant Isolation', description: 'Strict execution isolation ensures no data or policy leakage between tenants.' },
    { icon: Globe, title: 'Federation', description: 'Enable controlled cross-tenant sharing for shared tools and services.' },
    { icon: Layers, title: 'Policy Inheritance', description: 'Child tenants inherit parent policies with configurable override permissions.' },
    { icon: Settings, title: 'Self-Service Config', description: 'Tenant admins manage their own configuration without platform team intervention.' },
    { icon: Lock, title: 'Resource Boundaries', description: 'Enforce resource limits per tenant including compute, storage, and API quotas.' },
    { icon: Network, title: 'Network Isolation', description: 'Optional network-level isolation for tenants with strict security requirements.' },
    { icon: GitBranch, title: 'Tenant Versioning', description: 'Version and roll back tenant configurations with full change history.' },
  ],

  architecture: {
    description: 'The tenant management layer wraps all other governance modules, ensuring every operation is scoped to the correct organizational context.',
    layers: [
      { label: 'Management Plane', items: ['Tenant API', 'Admin Console', 'Provisioning Service'] },
      { label: 'Isolation Layer', items: ['Context Router', 'Resource Partitioner', 'Policy Scope Resolver'] },
      { label: 'Organization Model', items: ['Org Registry', 'Team Store', 'Membership Service', 'Hierarchy Engine'] },
      { label: 'Data Layer', items: ['Partitioned Storage', 'Tenant Config Store', 'Audit Partitions'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Tenant provisioning', description: 'New tenant is created via API or admin console with initial configuration.' },
      { label: 'Org structure setup', description: 'Teams and projects are defined within the tenant hierarchy.' },
      { label: 'Policy configuration', description: 'Tenant-specific policies are applied, inheriting from parent organization.' },
      { label: 'Agent registration', description: 'Agents are registered within the tenant scope with appropriate roles.' },
      { label: 'Request routing', description: 'Incoming requests are routed to the correct tenant context.' },
      { label: 'Isolated execution', description: 'All governance checks execute within the tenant boundary.' },
    ],
  },

  codeExample: {
    title: 'tenant-config.yaml',
    language: 'yaml',
    code: `# Runwall Tenant Configuration
tenant:
  id: "acme-corp"
  display_name: "Acme Corporation"
  tier: "enterprise"

organization:
  hierarchy:
    - level: "org"
      name: "Acme Corp"
      policy_inheritance: true
    - level: "team"
      name: "ML Platform"
      parent: "acme-corp"
      quota_override: true
    - level: "project"
      name: "agent-v2"
      parent: "ml-platform"

isolation:
  data: "strict"
  network: "shared"
  policy_scope: "hierarchical"

quotas:
  max_agents: 500
  max_actions_per_day: 1000000
  max_storage_gb: 100`,
  },

  faq: [
    { question: 'How many tenants can the platform support?', answer: 'Runwall is designed for unlimited tenants with consistent performance. The partitioned architecture ensures each tenant operates independently without noisy neighbor effects.' },
    { question: 'Can tenants override inherited policies?', answer: 'Yes, with configurable permissions. Parent organizations can mark policies as mandatory (non-overridable) or advisory (tenant can override). All overrides are logged.' },
    { question: 'How is data isolated between tenants?', answer: 'Data is partitioned at the storage level with separate encryption keys per tenant. Cross-tenant queries are architecturally impossible without explicit federation configuration.' },
    { question: 'Can I migrate agents between tenants?', answer: 'Yes. Runwall supports agent migration between tenants with configurable data transfer policies. Migration events are fully audited.' },
  ],
};

export default function TenantManagement() {
  return <FeaturePageTemplate data={data} />;
}
