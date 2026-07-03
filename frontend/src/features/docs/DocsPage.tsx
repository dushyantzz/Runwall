import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

const FEATURES_DOCS = [
  { id: '1', title: 'Intent-Aware Execution Policy', content: 'Our Intent-Aware Execution Policy engine translates raw tool calls and inputs into clear semantic actions (read, write, delete, execute). It scores risk based on context and decides whether to block, approve, or allow the command.' },
  { id: '2', title: 'Enterprise Identity & Session Management', content: 'Supports multi-tenant authentication, user contexts, granular roles, service accounts, and session tokens. Restricts active agent loops to specific tenant boundaries.' },
  { id: '3', title: 'Enterprise API Key Management', content: 'Protects key endpoints using cryptographically hashed credentials. Features anomaly detection (geo-velocity, IP tracking) to alert on leaked keys.' },
  { id: '4', title: 'Distributed Quotas & Rate Limiting', content: 'Protects downstream SaaS APIs and databases. Budgets credits or API calls dynamically and rate-limits agents before they hit provider exhaustion thresholds.' },
  { id: '5', title: 'Admin & Governance Controls', content: 'Gives security teams control over system configurations, evidence retention policies, maintenance modes, and session revocation.' },
  { id: '6', title: 'Taint Tracking Engine', content: 'Labels sensitive inputs (PII, secret data). Traces data flow through agent loops, ensuring that tainted outputs cannot be pushed to unverified external network sinks.' },
  { id: '7', title: 'Reversible Execution & Compensating Controls', content: 'Maintains a transaction-rollback log. If a mutating action fails, the system executes compensation scripts to rollback changes safely.' },
  { id: '8', title: 'Tool Trust & Provenance', content: 'Signatures and hash matching verify the source code and origin of all custom tools before runtime execution begins.' },
  { id: '9', title: 'Approval Workflow Engine', content: 'Intercepts actions that exceed risk thresholds, placing them in a queue for manual human reviewer approval.' },
  { id: '10', title: 'Optional Task Contracts', content: 'Allows users to approve a task contract (e.g. max spend, write limit). Once signed, the agent can bypass approval flows as long as it behaves within limits.' },
  { id: '11', title: 'Connector & Tool Architecture', content: 'Exposes secure adapters to dynamically register REST APIs, databases, and sandboxed shell engines as governed tools.' },
  { id: '12', title: 'OPA / Rego Policy System', content: 'Migrates simple rule checks to OPA (Open Policy Agent) utilizing declarative Rego policy bundles for deterministic decision-making.' },
  { id: '13', title: 'REST API Control Plane', content: 'FastAPI control plane to manage configurations, review approvals, deploy Rego rules, and extract audit logs programmatically.' },
];

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState(FEATURES_DOCS[0]);

  return (
    <FeaturePage
      title="Platform Documentation"
      description="Read detailed guides on the core architectural components of the Execution Governance Platform."
      icon={<BookOpen className="h-5 w-5" />}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0 space-y-1">
          {FEATURES_DOCS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                activeDoc.id === doc.id
                  ? 'bg-toast text-primary font-medium'
                  : 'text-muted-foreground hover:bg-[var(--alpha-4)] hover:text-foreground'
              }`}
            >
              {doc.title}
            </button>
          ))}
        </aside>

        <section className="flex-1 rounded border border-[var(--border)] bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{activeDoc.title}</h2>
          <div className="text-sm leading-relaxed text-muted-foreground space-y-4">
            <p>{activeDoc.content}</p>
            <div className="p-4 rounded bg-semantic-1 border border-[var(--border)] font-mono text-xs">
              {`// Component: secure_mcp_server.governance.${activeDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
            </div>
          </div>
        </section>
      </div>
    </FeaturePage>
  );
}
