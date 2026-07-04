import { ClipboardList, Database, Play, FileText, Shield, Search, Download, Lock, Clock } from 'lucide-react';
import FeaturePageTemplate, { type FeaturePageData } from '../../components/FeaturePageTemplate';

const data: FeaturePageData = {
  icon: ClipboardList,
  title: 'Audit / Evidence / Replay',
  subtitle: 'Immutable audit logs, complete session replay, and compliance evidence packs — providing cryptographic proof of every agent action and governance decision.',
  badgeText: 'Audit & Compliance',

  problem: {
    heading: 'No verifiable record of what agents did',
    description: 'When an incident occurs or an auditor asks for evidence, teams scramble to reconstruct what happened from scattered logs, incomplete traces, and unreliable memory.',
    points: [
      'Agent actions are logged inconsistently or not at all',
      'No tamper-proof audit trail for compliance',
      'Cannot replay an agent session to understand what happened',
      'Evidence for compliance audits is manually assembled',
      'No cryptographic proof that logs have not been altered',
    ],
  },

  whatItDoes: {
    heading: 'Complete, immutable audit infrastructure',
    description: 'AegisGuard records every agent action, policy decision, and governance event in an immutable, cryptographically-signed audit log with full session replay capabilities.',
    points: [
      'Immutable, append-only audit logs',
      'Cryptographic signing for tamper detection',
      'Full session replay with step-by-step visualization',
      'Compliance evidence pack generation',
      'Structured log queries with filtering',
      'Long-term retention with configurable policies',
      'Real-time audit event streaming',
      'SOC 2, HIPAA, and SOX evidence templates',
    ],
  },

  whyItMatters: {
    heading: 'Why audit trails are non-negotiable',
    description: 'In enterprise AI, "trust but verify" is not enough. You need cryptographic proof of every action, decision, and outcome.',
    benefits: [
      { title: 'Incident Response', description: 'Replay any agent session to understand exactly what happened, what decisions were made, and why.' },
      { title: 'Compliance Proof', description: 'Generate compliance evidence packs for SOC 2, HIPAA, SOX, and custom frameworks with one click.' },
      { title: 'Tamper Detection', description: 'Cryptographic signatures ensure log integrity. Any unauthorized modification is immediately detectable.' },
    ],
  },

  capabilities: [
    { icon: Database, title: 'Immutable Logs', description: 'Append-only log storage with cryptographic chaining. Once written, entries cannot be modified or deleted.' },
    { icon: Play, title: 'Session Replay', description: 'Replay any agent session step-by-step with full context — inputs, outputs, decisions, and timing.' },
    { icon: FileText, title: 'Evidence Packs', description: 'Auto-generate compliance evidence packages with filtered, structured data for specific audit scopes.' },
    { icon: Shield, title: 'Crypto Signatures', description: 'Every log entry is cryptographically signed and hash-chained for tamper-evident integrity.' },
    { icon: Search, title: 'Query Engine', description: 'Search and filter audit logs by agent, tool, risk score, policy decision, time range, and more.' },
    { icon: Download, title: 'Export', description: 'Export audit data in JSON, CSV, SIEM-compatible formats, or directly to S3/GCS.' },
    { icon: Lock, title: 'Access Control', description: 'Audit log access is governed by its own RBAC policies. Only authorized roles can view sensitive evidence.' },
    { icon: Clock, title: 'Retention Policies', description: 'Configurable retention periods with automatic archival and legal hold capabilities.' },
    { icon: ClipboardList, title: 'Compliance Templates', description: 'Pre-built templates for SOC 2, HIPAA, SOX, GDPR, and custom compliance frameworks.' },
  ],

  architecture: {
    description: 'The Audit module receives events from every governance component, writes them to immutable storage, and provides query and replay capabilities.',
    layers: [
      { label: 'Event Sources', items: ['Runtime Interceptor', 'Policy Engine', 'Risk Scorer', 'Approval Engine', 'Identity Service'] },
      { label: 'Ingestion', items: ['Event Router', 'Schema Normalizer', 'Crypto Signer', 'Hash Chainer'] },
      { label: 'Storage', items: ['Immutable Log Store', 'Session Store', 'Evidence Archive', 'Retention Manager'] },
      { label: 'Access', items: ['Query API', 'Replay Engine', 'Evidence Generator', 'Export Service', 'SIEM Connector'] },
    ],
  },

  workflow: {
    steps: [
      { label: 'Event generated', description: 'A governance event occurs — policy decision, risk score, approval, or agent action.' },
      { label: 'Event captured', description: 'The event is captured with full context including agent, tool, inputs, outputs, and timing.' },
      { label: 'Signed and chained', description: 'Event is cryptographically signed and hash-chained to the previous entry.' },
      { label: 'Written to store', description: 'Signed event is written to the immutable, append-only log store.' },
      { label: 'Indexed for query', description: 'Event is indexed across multiple dimensions for fast querying and filtering.' },
      { label: 'Available for replay', description: 'Session events are linked for sequential replay with full context reconstruction.' },
    ],
  },

  codeExample: {
    title: 'audit-config.yaml',
    language: 'yaml',
    code: `# AegisGuard Audit Configuration
audit:
  signing:
    algorithm: "ed25519"
    key_rotation: "30d"
    chain_verification: true

  retention:
    default: "365d"
    compliance_hold: "7y"
    auto_archive_after: "90d"

  capture:
    events:
      - "policy.decision"
      - "risk.score"
      - "approval.request"
      - "approval.decision"
      - "agent.action"
      - "identity.auth"
    include_context: true
    include_io: true
    redact_sensitive: true

  evidence_packs:
    templates:
      - name: "soc2-type2"
        scope: ["access_control", "audit_logs", "risk_management"]
        format: "pdf"
      - name: "hipaa"
        scope: ["data_access", "audit_logs", "encryption"]
        format: "json"

  export:
    siem:
      enabled: true
      format: "cef"
      endpoint: "https://siem.company.com/events"`,
  },

  faq: [
    { question: 'How long are audit logs retained?', answer: 'Retention is configurable per tenant. Default retention is 365 days with automatic archival to cold storage. Compliance holds can extend retention to 7+ years for regulated industries.' },
    { question: 'Can I export audit data to my SIEM?', answer: 'Yes. AegisGuard supports real-time streaming to Splunk, Datadog, ELK, and custom SIEM platforms via CEF, JSON, and syslog formats.' },
    { question: 'How do I verify log integrity?', answer: 'Every log entry is cryptographically signed and hash-chained. The verification API allows you to validate the entire chain or individual entries at any time. Any tampering breaks the chain.' },
    { question: 'What does session replay look like?', answer: 'Session replay shows a step-by-step timeline of agent actions with full context: what tool was called, what inputs were provided, what the policy engine decided, what the risk score was, and what the tool returned.' },
  ],
};

export default function AuditEvidenceReplay() {
  return <FeaturePageTemplate data={data} />;
}
