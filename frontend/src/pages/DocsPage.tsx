import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronRight, ChevronDown, Search,
  Copy, Info,
  Fingerprint, Building2, Puzzle, FileCode2, Radio, BarChart3,
  Route, GitBranch, ClipboardList, RotateCcw, Gauge, Box
} from 'lucide-react';

// Import all 12 feature components
import IdentityAccessControl from './features/IdentityAccessControl';
import TenantManagement from './features/TenantManagement';
import ToolMcpRegistry from './features/ToolMcpRegistry';
import PolicyEngine from './features/PolicyEngine';
import RuntimeInterceptor from './features/RuntimeInterceptor';
import RiskScoringEngine from './features/RiskScoringEngine';
import TaintTrackingEngine from './features/TaintTrackingEngine';
import ApprovalWorkflowEngine from './features/ApprovalWorkflowEngine';
import AuditEvidenceReplay from './features/AuditEvidenceReplay';
import RollbackCompensating from './features/RollbackCompensating';
import QuotasBudgetsRateLimits from './features/QuotasBudgetsRateLimits';
import SandboxingExecutionProfiles from './features/SandboxingExecutionProfiles';

/* ─────────────────────────────────────────────────────────────
   TYPES & CONTEXT DATA
   ───────────────────────────────────────────────────────────── */

interface DocSection {
  id: string;
  title: string;
  icon?: any;
  category: string;
  component?: React.ReactNode;
}

const CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'features', label: 'Core Features' },
  { id: 'api-config', label: 'APIs & Configuration' }
];

export default function DocsPage() {
  const { pageId = 'introduction' } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'getting-started': true,
    'features': true,
    'api-config': true
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const docSections: DocSection[] = [
    // Getting Started
    {
      id: 'introduction',
      title: 'Introduction',
      category: 'getting-started',
      component: <IntroductionDoc />
    },
    {
      id: 'quickstart',
      title: 'Quick Start Guide',
      category: 'getting-started',
      component: <QuickStartDoc onCopy={copyToClipboard} />
    },
    // Core Features
    { id: 'identity-access-control', title: 'Identity & Access Control', icon: Fingerprint, category: 'features', component: <IdentityAccessControl /> },
    { id: 'tenant-management', title: 'Tenant & Org Management', icon: Building2, category: 'features', component: <TenantManagement /> },
    { id: 'tool-mcp-registry', title: 'Tool / MCP Registry', icon: Puzzle, category: 'features', component: <ToolMcpRegistry /> },
    { id: 'policy-engine', title: 'Policy Engine', icon: FileCode2, category: 'features', component: <PolicyEngine /> },
    { id: 'runtime-interceptor', title: 'Runtime Interceptor', icon: Radio, category: 'features', component: <RuntimeInterceptor /> },
    { id: 'risk-scoring-engine', title: 'Risk Scoring Engine', icon: BarChart3, category: 'features', component: <RiskScoringEngine /> },
    { id: 'taint-tracking-engine', title: 'Taint Tracking Engine', icon: Route, category: 'features', component: <TaintTrackingEngine /> },
    { id: 'approval-workflow-engine', title: 'Approval Workflow Engine', icon: GitBranch, category: 'features', component: <ApprovalWorkflowEngine /> },
    { id: 'audit-evidence-replay', title: 'Audit / Evidence / Replay', icon: ClipboardList, category: 'features', component: <AuditEvidenceReplay /> },
    { id: 'rollback-compensating', title: 'Rollback / Compensating', icon: RotateCcw, category: 'features', component: <RollbackCompensating /> },
    { id: 'quotas-budgets-rate-limits', title: 'Quotas / Budgets / Limits', icon: Gauge, category: 'features', component: <QuotasBudgetsRateLimits /> },
    { id: 'sandboxing-execution-profiles', title: 'Sandboxing / Exec Profiles', icon: Box, category: 'features', component: <SandboxingExecutionProfiles /> },
    // APIs & Config
    {
      id: 'server-configuration',
      title: 'Server Configuration',
      category: 'api-config',
      component: <ServerConfigurationDoc onCopy={copyToClipboard} />
    },
    {
      id: 'rest-api',
      title: 'REST API Control Plane',
      category: 'api-config',
      component: <RestApiDoc onCopy={copyToClipboard} />
    }
  ];

  const activeDoc = docSections.find(d => d.id === pageId) || docSections[0];
  const activeCategory = CATEGORIES.find(c => c.id === activeDoc.category);

  // Filter sections for search
  const filteredSections = docSections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      background: '#000000',
      color: 'var(--body, #b4b4b4)',
      fontFamily: 'var(--font-body)',
      paddingTop: '60px' // Offset fixed navbar
    }}>
      {/* ── 1. LEFT SIDEBAR ── */}
      <aside style={{
        width: '280px',
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: '60px',
        bottom: 0,
        left: 0,
        zIndex: 10,
        overflowY: 'auto'
      }} className="docs-sidebar">
        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid #141414' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--muted, #777777)'
            }} />
            <input
              type="text"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#0a0a0a',
                border: '1px solid #1c1c1c',
                borderRadius: '6px',
                padding: '8px 12px 8px 34px',
                fontSize: '13px',
                color: 'var(--heading, #ffffff)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Navigation Categories */}
        <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {CATEGORIES.map(category => {
            const categoryItems = filteredSections.filter(item => item.category === category.id);
            if (categoryItems.length === 0) return null;

            const isExpanded = expandedCategories[category.id];

            return (
              <div key={category.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: 'var(--heading, #ffffff)',
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '6px 0',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <span>{category.label}</span>
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '4px' }}>
                    {categoryItems.map(item => {
                      const isActive = item.id === activeDoc.id;
                      const Icon = item.icon || BookOpen;

                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(`/docs/${item.id}`)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            width: '100%',
                            background: isActive ? 'rgba(255, 218, 98, 0.08)' : 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            color: isActive ? 'var(--accent, #FFDA62)' : '#b4b4b4',
                            fontSize: '13px',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            outline: 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) e.currentTarget.style.color = '#b4b4b4';
                          }}
                        >
                          <Icon size={14} style={{ opacity: isActive ? 1 : 0.6 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ── 2. MAIN DOCS CONTENT ── */}
      <main style={{
        marginLeft: '280px',
        flexGrow: 1,
        padding: '40px 48px 80px',
        maxWidth: '1200px',
        zIndex: 1,
        minWidth: 0
      }} className="docs-content">
        {/* Breadcrumbs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: 'var(--muted, #777777)',
          marginBottom: '20px'
        }}>
          <span>Docs</span>
          <ChevronRight size={10} />
          <span>{activeCategory?.label}</span>
          <ChevronRight size={10} />
          <span style={{ color: 'var(--accent, #FFDA62)' }}>{activeDoc.title}</span>
        </div>

        {/* Dynamic Doc Rendering */}
        <div>
          {activeDoc.component}
        </div>
      </main>

      {/* Mobile adaptation CSS override */}
      <style>{`
        @media (max-width: 768px) {
          .docs-sidebar { display: none !important; }
          .docs-content { marginLeft: 0 !important; padding: 24px !important; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DOCUMENTATION MARKDOWN/CONTENT COMPONENTS
   ───────────────────────────────────────────────────────────── */

/* ── A. INTRODUCTION DOC ── */
function IntroductionDoc() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--heading, #ffffff)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }} id="overview">
        Getting Started
      </h1>

      <p style={{ fontSize: '16px', lineHeight: '1.7', color: 'var(--body, #b4b4b4)' }}>
        <strong>Runwall</strong> is an intelligent security gateway that sits directly between your AI reasoning models and your real-world tools and infrastructure. It inspects every intent, parameter, and risk profile <strong>before</strong> execution, enforcing enterprise policies in real time — so your AI agents can move fast without becoming a security liability.
      </p>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255, 218, 98, 0.04)',
        border: '1px solid rgba(255, 218, 98, 0.15)',
        borderRadius: '8px',
        padding: '16px',
        fontSize: '14px',
        color: '#ffffff'
      }}>
        <Info size={18} style={{ color: 'var(--accent, #FFDA62)', flexShrink: 0 }} />
        <span>
          Traditional security asks: <em>"Can this user access this tool?"</em>. Runwall asks: <em>"Is this specific action, right now, under this policy, actually safe?"</em>.
        </span>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Why Runwall?
      </h2>
      <p style={{ lineHeight: '1.6' }}>
        Everyone is wiring AI agents into production environments (Salesforce, Slack, internal databases, shell terminals) using standard protocols like the Model Context Protocol (MCP). Unprotected, these connections behave like unlocked doors:
      </p>
      
      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Prompt Injection Threat:</strong> A malicious instruction hidden in a web page or file can hijack your agent into executing destructive actions (e.g., "delete database").</li>
        <li><strong>Infinite Loops:</strong> A minor agent logic loop can trigger thousands of API calls in minutes, draining budgets.</li>
        <li><strong>The Trust Gap:</strong> Naive binary permissions cannot express nuance (e.g., "read one record" looks the same to an access control list as "export database").</li>
      </ul>

      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Core Pillars of Governance
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '8px' }}>
        <div style={{ padding: '16px', border: '1px solid #1c1c1c', borderRadius: '8px', background: '#050505' }}>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>🛡️ Intent-Aware Policy</h4>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Classifies and scores the semantic threat level of requests using local evaluation and Open Policy Agent (OPA).
          </p>
        </div>
        <div style={{ padding: '16px', border: '1px solid #1c1c1c', borderRadius: '8px', background: '#050505' }}>
          <h4 style={{ color: '#fff', fontWeight: 600, marginBottom: '6px', fontSize: '14px' }}>🔍 Taint Tracking</h4>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Traces untrusted data sources (e.g. web pages) to sinks (e.g. SQL databases) to stop prompt injection attacks.
          </p>
        </div>
      </div>
    </article>
  );
}

/* ── B. QUICK START DOC ── */
function QuickStartDoc({ onCopy }: { onCopy: (t: string) => void }) {
  const localDevCmd = `fastmcp run server.py --transport streamable-http --host 0.0.0.0 --port 8000`;
  
  const dockerCmd = `docker run -d -p 8000:8000 \\
  -e SECRET_KEY=your-production-secret-key \\
  -e DATABASE_URL=postgresql+asyncpg://postgres:pass@host:5432/db \\
  dushyantzz/secure-mcp-server:latest`;

  const mcpConfigLocal = `{
  "mcpServers": {
    "runwall-local": {
      "url": "http://localhost:8000/mcp"
    }
  }
}`;

  const mcpConfigCloud = `{
  "mcpServers": {
    "runwall-cloud": {
      "url": "https://runwall-production.up.railway.app/mcp"
    }
  }
}`;

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="quickstart">
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--heading, #ffffff)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}>
        Quick Start Guide
      </h1>

      <p style={{ fontSize: '16px', lineHeight: '1.7' }}>
        Configure the Runwall gateway in your local or cloud environment and hook it up to your favorite AI agent clients.
      </p>

      {/* Option A: Cloud Deployment */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Option A — Connect to Live Cloud Gateway (Railway)
      </h2>
      <p>
        If you are using our hosted secure cloud infrastructure, you can bypass local setup entirely and connect directly to your cloud endpoint:
      </p>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(mcpConfigCloud)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'
          }}
        >
          <Copy size={12} style={{ marginRight: '4px' }} /> Copy Config
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{mcpConfigCloud}</code>
        </pre>
      </div>

      {/* Option B: Local Setup */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Option B — Local Development Setup
      </h2>
      
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginTop: '8px' }}>
        1. Run Locally via Python
      </h3>
      <p>
        Install requirements and run the FastMCP engine locally on port 8000:
      </p>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(localDevCmd)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'
          }}
        >
          <Copy size={12} style={{ marginRight: '4px' }} /> Copy Command
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{localDevCmd}</code>
        </pre>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        2. Run Locally via Docker
      </h3>
      <p>
        Deploy the official Runwall gateway container locally:
      </p>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(dockerCmd)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'
          }}
        >
          <Copy size={12} style={{ marginRight: '4px' }} /> Copy Command
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{dockerCmd}</code>
        </pre>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        3. Connect Local IDE
      </h3>
      <p>
        Paste this block in your configuration files to connect locally:
      </p>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(mcpConfigLocal)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'
          }}
        >
          <Copy size={12} style={{ marginRight: '4px' }} /> Copy Config
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{mcpConfigLocal}</code>
        </pre>
      </div>

      {/* Configuration Paths */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Step 3 — Locate Config Files
      </h2>
      <p>
        Add your chosen configuration block to one of the following location files depending on your client application:
      </p>
      
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '12px',
        fontSize: '13px',
        lineHeight: '1.6',
        textAlign: 'left'
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #1c1c1c' }}>
            <th style={{ padding: '8px 12px', color: '#fff', fontWeight: 600 }}>Client</th>
            <th style={{ padding: '8px 12px', color: '#fff', fontWeight: 600 }}>Configuration File Path</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Cursor</strong></td>
            <td style={{ padding: '10px 12px' }}><code>%USERPROFILE%\.gemini\config\mcp_config.json</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Claude Desktop</strong></td>
            <td style={{ padding: '10px 12px' }}><code>%APPDATA%\Claude\claude_desktop_config.json</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Cline (VS Code)</strong></td>
            <td style={{ padding: '10px 12px' }}><code>%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json</code></td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

/* ── C. SERVER CONFIGURATION DOC ── */
function ServerConfigurationDoc({ onCopy }: { onCopy: (t: string) => void }) {
  const envContent = `SECRET_KEY=your-production-secret-key
DATABASE_URL=postgresql+asyncpg://postgres.catmnzhnxfmgayvnvszh:pass@host:5432/postgres
REDIS_URL=redis://localhost:6379/0
ENABLE_RATE_LIMITING=true
DEFAULT_TENANT_RPM=1000
ENABLE_INTENT_POLICY=true`;

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--heading, #ffffff)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}>
        Server Configuration
      </h1>

      <p style={{ fontSize: '16px', lineHeight: '1.7' }}>
        Manage backend behavior using environment variables. Configure database connections, OPA policies, and Redis scaling settings.
      </p>

      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Environment Variables
      </h2>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(envContent)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'
          }}
        >
          <Copy size={12} style={{ marginRight: '4px' }} /> Copy
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{envContent}</code>
        </pre>
      </div>

      <table style={{
        width: '100%', borderCollapse: 'collapse', border: '1px solid #1c1c1c',
        marginTop: '16px', fontSize: '14px', textAlign: 'left'
      }}>
        <thead>
          <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #1c1c1c' }}>
            <th style={{ padding: '12px' }}>Variable</th>
            <th style={{ padding: '12px' }}>Description</th>
            <th style={{ padding: '12px' }}>Default</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #121212' }}>
            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>DATABASE_URL</td>
            <td style={{ padding: '12px' }}>SQLAlchemy Postgres/SQLite connection endpoint.</td>
            <td style={{ padding: '12px', color: 'var(--muted)' }}>SQLite local db</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #121212' }}>
            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>REDIS_URL</td>
            <td style={{ padding: '12px' }}>Connection to Redis instance for sliding window quotas.</td>
            <td style={{ padding: '12px', color: 'var(--muted)' }}>None (Fallback: Memory)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #121212' }}>
            <td style={{ padding: '12px', fontFamily: 'var(--font-mono)' }}>ENABLE_INTENT_POLICY</td>
            <td style={{ padding: '12px' }}>Controls execution intent validation checks.</td>
            <td style={{ padding: '12px' }}>true</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

/* ── D. REST API DOC ── */
function RestApiDoc({ onCopy }: { onCopy: (t: string) => void }) {
  const getPoliciesCmd = `curl -X GET http://localhost:8000/api/v1/policies \\
  -H "Authorization: Bearer <your-jwt-token>"`;

  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--heading, #ffffff)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}>
        REST API Control Plane
      </h1>

      <p style={{ fontSize: '16px', lineHeight: '1.7' }}>
        Runwall hosts a FastAPI REST control plane alongside the MCP server. This allows administrators to manage security parameters, view logs, and approve stages programmatically.
      </p>

      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Common Endpoints
      </h2>

      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <li><strong>GET `/api/v1/policies`</strong>: Retrieve deployed intent rule bundles.</li>
        <li><strong>POST `/api/v1/approvals/`</strong>: Review or override paused agent actions.</li>
        <li><strong>GET `/api/v1/audit`</strong>: Query chronological security event histories.</li>
      </ul>

      <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        Request Example
      </h3>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(getPoliciesCmd)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer'
          }}
        >
          <Copy size={12} style={{ marginRight: '4px' }} /> Copy
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{getPoliciesCmd}</code>
        </pre>
      </div>
    </article>
  );
}
