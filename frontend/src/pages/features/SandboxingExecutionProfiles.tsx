import { Box, Lock, Shield, Layers, Settings, Activity, Eye, FileCode2, Container } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: Box,
  title: 'Sandboxing / Execution Profiles',
  subtitle: 'Isolate agent execution in permission-scoped sandboxes with configurable execution profiles — controlling exactly what each agent can access, modify, and communicate with.',
  badgeText: 'Execution Isolation',

  problem: {
    heading: 'Agents execute with unrestricted access',
    description: 'Most agent frameworks run with the full permissions of their host process. A compromised or misbehaving agent can access any file, call any API, and modify any resource on the system.',
    points: [
      'Agents inherit full host process permissions',
      'No execution-level isolation between agents',
      'Compromised agents can access arbitrary system resources',
      'Cannot restrict network, filesystem, or API access per agent',
      'No execution profiles for different trust levels',
    ],
  },

  whatItDoes: {
    heading: 'Permission-scoped execution environments',
    description: 'AegisGuard sandboxes every agent execution within a configured profile that restricts filesystem access, network communication, available tools, and system resources.',
    points: [
      'Per-agent execution sandboxes',
      'Configurable permission profiles',
      'Filesystem access restrictions',
      'Network egress controls',
      'Tool access whitelisting',
      'Resource limits (CPU, memory, time)',
      'Execution profile inheritance',
      'Runtime profile switching',
    ],
  },

  whyItMatters: {
    heading: 'Why execution isolation is critical',
    description: 'Sandboxing is the last line of defense. Even if policy is misconfigured and risk is miscalculated, a properly sandboxed agent cannot exceed its granted permissions.',
    benefits: [
      { title: 'Blast Radius Containment', description: 'A compromised agent can only affect resources within its sandbox. System-wide damage is architecturally impossible.' },
      { title: 'Defense in Depth', description: 'Sandboxing adds a fundamental isolation layer independent of policy, identity, and risk — providing true defense in depth.' },
      { title: 'Trust Gradients', description: 'Different agents get different execution profiles based on trust level — from minimal read-only sandboxes to broader production access.' },
    ],
  },

  capabilities: [
    { icon: Lock, title: 'Permission Profiles', description: 'Define fine-grained permission sets: filesystem paths, network hosts, tools, and system calls.' },
    { icon: Shield, title: 'Filesystem Isolation', description: 'Restrict agent filesystem access to specific directories with read, write, or no-access controls.' },
    { icon: Layers, title: 'Network Controls', description: 'Whitelist allowed network destinations. Block all egress except explicitly permitted hosts.' },
    { icon: Settings, title: 'Resource Limits', description: 'CPU, memory, execution time, and I/O limits per agent execution.' },
    { icon: Activity, title: 'Runtime Monitoring', description: 'Monitor sandbox boundary violations in real-time with alerting.' },
    { icon: Eye, title: 'Syscall Filtering', description: 'Filter and restrict system calls available within the sandbox environment.' },
    { icon: FileCode2, title: 'Profile Templates', description: 'Pre-built execution profiles for common use cases: read-only, internal-api, full-access.' },
    { icon: Box, title: 'Container Isolation', description: 'Option for full container-level isolation for maximum security requirements.' },
    { icon: Container, title: 'Profile Inheritance', description: 'Child profiles inherit restrictions from parent profiles with additive constraints.' },
  ],

  architecture: {
    description: 'The Sandboxing Engine wraps agent execution in a controlled environment, enforcing permissions at the OS, network, and application layer.',
    layers: [
      { label: 'Profile Management', items: ['Profile Registry', 'Template Library', 'Inheritance Resolver'] },
      { label: 'Sandbox Runtime', items: ['Container Runtime', 'Syscall Filter', 'Namespace Isolator', 'Cgroup Controller'] },
      { label: 'Access Control', items: ['Filesystem ACL', 'Network Firewall', 'Tool Whitelist', 'Resource Limiter'] },
      { label: 'Monitoring', items: ['Boundary Monitor', 'Violation Detector', 'Alert Engine', 'Metrics Collector'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Profile selected', description: 'Execution profile is determined from agent identity, role, and requested operation.' },
      { label: 'Sandbox created', description: 'Isolated execution environment is provisioned with the profile\'s permissions.' },
      { label: 'Agent executes', description: 'Agent runs within the sandbox with enforced filesystem, network, and resource limits.' },
      { label: 'Boundaries monitored', description: 'All boundary access attempts are monitored and logged in real-time.' },
      { label: 'Violations detected', description: 'Any attempt to exceed sandbox permissions is blocked and reported.' },
      { label: 'Sandbox cleaned', description: 'After execution, the sandbox is destroyed with all temporary state.' },
    ],
  },

  codeExample: {
    title: 'execution-profile.yaml',
    language: 'yaml',
    code: `# AegisGuard Execution Profile
profiles:
  - name: "restricted-reader"
    description: "Read-only access to internal APIs"

    filesystem:
      allow_read: ["/data/public", "/config/shared"]
      allow_write: []
      deny: ["/secrets", "/credentials"]

    network:
      allow_egress:
        - host: "internal-api.company.com"
          ports: [443]
        - host: "data-lake.company.com"
          ports: [5432]
      deny_egress: ["*"]

    tools:
      allowed: ["web_search", "data_query", "calculator"]
      denied: ["file_write", "api_post", "code_execute"]

    resources:
      max_cpu: "0.5"
      max_memory: "512Mi"
      max_execution_time: "5m"
      max_io_ops: 1000

  - name: "production-writer"
    inherits: "restricted-reader"
    filesystem:
      allow_write: ["/data/output"]
    tools:
      allowed: ["web_search", "data_query", "api_post"]
    resources:
      max_cpu: "2.0"
      max_memory: "2Gi"`,
  },

  faq: [
    { question: 'What level of isolation does sandboxing provide?', answer: 'AegisGuard supports multiple isolation levels: application-level sandboxing (fastest, lightest), container-level isolation (moderate), and VM-level isolation (maximum security). Choose based on your threat model.' },
    { question: 'Does sandboxing affect performance?', answer: 'Application-level sandboxing adds negligible overhead (<1ms). Container-level isolation adds a small startup overhead but has minimal runtime impact. Performance characteristics are documented per isolation mode.' },
    { question: 'Can agents request elevated permissions?', answer: 'Yes, through the approval workflow engine. An agent can request a profile upgrade which routes through human approval before being granted.' },
    { question: 'How do execution profiles work with multi-step agent workflows?', answer: 'Each step in a workflow can have a different execution profile. The runtime dynamically switches profiles based on the current step, ensuring each phase runs with minimal required permissions.' },
  ],
};

export default function SandboxingExecutionProfiles() {
  return <FeaturePageTemplate data={data} />;
}
