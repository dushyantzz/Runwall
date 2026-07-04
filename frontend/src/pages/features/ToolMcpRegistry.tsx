import { Puzzle, Package, Search, Tag, Shield, RefreshCw, FileCode2, Layers, GitBranch } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Puzzle,
  title: 'Tool / MCP Registry',
  subtitle: 'A centralized catalog of every tool and Model Context Protocol server your agents can access — with capability declarations, version management, and governance metadata.',
  badgeText: 'Tool Registry',

  problem: {
    heading: 'Agents access tools without a governed catalog',
    description: 'Without a centralized registry, agents discover and invoke tools ad-hoc. No one knows what tools exist, what they can do, or what risks they carry.',
    points: [
      'No central inventory of available tools and MCP servers',
      'Tool capabilities are undocumented and unversioned',
      'Agents invoke deprecated or unsafe tool versions',
      'No way to enforce tool approval workflows before production',
      'Risk metadata is disconnected from tool definitions',
    ],
  },

  whatItDoes: {
    heading: 'The single source of truth for agent tooling',
    description: 'AegisGuard provides a governed registry where every tool and MCP server is cataloged, versioned, and enriched with governance metadata before agents can invoke it.',
    points: [
      'Centralized tool and MCP server catalog',
      'Capability declarations with typed schemas',
      'Version management with deprecation policies',
      'Risk classification and sensitivity labels',
      'Approval workflows for new tool registration',
      'Dependency tracking between tools',
      'Usage analytics and invocation metrics',
      'Integration with policy engine for tool-level rules',
    ],
  },

  whyItMatters: {
    heading: 'Why a governed registry is essential',
    description: 'A registry transforms tools from opaque black boxes into governed, auditable, policy-bound primitives.',
    benefits: [
      { title: 'Visibility', description: 'Complete inventory of every tool available to agents, with capabilities, owners, and risk classifications.' },
      { title: 'Governance', description: 'No tool reaches production without approval. Every version change is tracked and auditable.' },
      { title: 'Reliability', description: 'Version pinning and deprecation policies prevent agents from using unstable or unsafe tool versions.' },
    ],
  },

  capabilities: [
    { icon: Package, title: 'Tool Catalog', description: 'Browse, search, and filter all registered tools with rich metadata and capability descriptions.' },
    { icon: Search, title: 'Discovery API', description: 'Agents discover available tools programmatically with scope-filtered search and capability matching.' },
    { icon: Tag, title: 'Version Control', description: 'Semantic versioning with deprecation notices, migration guides, and forced upgrade policies.' },
    { icon: Shield, title: 'Risk Labels', description: 'Classify tools by risk level (low, medium, high, critical) with automatic policy binding.' },
    { icon: RefreshCw, title: 'Sync Engine', description: 'Auto-discover and sync tools from MCP servers, OpenAPI specs, and custom connectors.' },
    { icon: FileCode2, title: 'Schema Registry', description: 'Typed input/output schemas for every tool, enabling compile-time validation of agent tool calls.' },
    { icon: Layers, title: 'Dependency Graph', description: 'Track tool dependencies and detect breaking changes across the agent ecosystem.' },
    { icon: GitBranch, title: 'Approval Workflow', description: 'New tools require review and approval before they are available to agents in production.' },
    { icon: Puzzle, title: 'MCP Integration', description: 'Native Model Context Protocol support with automatic capability extraction and registration.' },
  ],

  architecture: {
    description: 'The Tool Registry integrates with identity, policy, and risk modules to enforce governance at the tool definition level — before any invocation occurs.',
    layers: [
      { label: 'Discovery', items: ['MCP Scanner', 'OpenAPI Importer', 'Manual Registration', 'Auto-Discovery'] },
      { label: 'Registry Core', items: ['Tool Store', 'Version Manager', 'Schema Validator', 'Dependency Tracker'] },
      { label: 'Governance', items: ['Risk Classifier', 'Approval Engine', 'Policy Binder', 'Usage Metering'] },
      { label: 'Integration', items: ['Agent SDK', 'CLI Tools', 'Admin API', 'Webhook Notifier'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Tool submission', description: 'Developer or MCP scanner submits a new tool with capability schema and metadata.' },
      { label: 'Schema validation', description: 'Input/output schemas are validated and normalized to the registry standard.' },
      { label: 'Risk classification', description: 'Automatic risk scoring based on capabilities, data access patterns, and side effects.' },
      { label: 'Approval review', description: 'Tool is routed through the approval workflow for security and platform team review.' },
      { label: 'Registration', description: 'Approved tool is published to the registry with version tag and policy bindings.' },
      { label: 'Agent discovery', description: 'Agents discover the tool via the Discovery API within their scoped permissions.' },
    ],
  },

  codeExample: {
    title: 'tool-registration.yaml',
    language: 'yaml',
    code: `# AegisGuard Tool Registration
tool:
  name: "web_search"
  version: "2.1.0"
  protocol: "mcp"
  server: "search-mcp-server"

capabilities:
  - name: "search"
    description: "Search the web for information"
    input:
      query: { type: "string", required: true }
      max_results: { type: "integer", default: 10 }
    output:
      results: { type: "array", items: "SearchResult" }
    side_effects: false
    data_access: "read-only"

governance:
  risk_level: "low"
  sensitivity: "public"
  requires_approval: false
  allowed_roles: ["agent-reader", "agent-writer"]
  max_invocations_per_minute: 100

deprecation:
  previous_version: "2.0.0"
  sunset_date: "2025-12-01"
  migration_guide: "docs/migration/web-search-v2.md"`,
  },

  faq: [
    { question: 'Does the registry support non-MCP tools?', answer: 'Yes. While MCP tools are auto-discovered, the registry supports any tool type including REST APIs, GraphQL endpoints, CLI tools, and custom integrations via the registration API.' },
    { question: 'How are tools versioned?', answer: 'Tools use semantic versioning (semver). Breaking changes require a major version bump. Deprecated versions can be sunset with configurable grace periods and forced upgrade policies.' },
    { question: 'Can I restrict which agents can access specific tools?', answer: 'Yes. Tool access is governed by RBAC roles and ABAC policies. Each tool can specify allowed roles, and additional policies can restrict access based on agent attributes, tenant, or risk score.' },
    { question: 'What happens if a tool fails health checks?', answer: 'Unhealthy tools are automatically flagged and can be configured to be temporarily disabled, rate-limited, or routed to fallback implementations.' },
  ],
};

export default function ToolMcpRegistry() {
  return <FeaturePageTemplate data={data} />;
}
