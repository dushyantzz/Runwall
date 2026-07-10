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
        Configure the Runwall gateway and hook it up to your favorite AI agent clients in seconds.
      </p>

      {/* Step 1: Connect to Secure Gateway */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Step 1 — Connect your Client to Runwall MCP Server
      </h2>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#b4b4b4' }}>
        Choose your environment below to connect your agent client to the secure Runwall governance layer:
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '8px' }}>
        {/* Cursor IDE */}
        <div style={{ background: '#080808', border: '1px solid #1c1c1c', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>1. Cursor IDE</h4>
            <p style={{ fontSize: '12px', color: '#888888', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Add a new command tool under <strong>Settings &gt; Models &gt; MCP</strong> to protect your active workspace.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#555555', fontFamily: 'monospace' }}>CONFIG TYPE: COMMAND</span>
              <button onClick={() => onCopy("npx -y secure-mcp")} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Copy Command</button>
            </div>
            <pre style={{ background: '#020202', border: '1px solid #111111', borderRadius: '4px', padding: '10px', margin: 0, fontSize: '11px', color: '#00b4d8', fontFamily: 'monospace' }}>
              npx -y secure-mcp
            </pre>
          </div>
        </div>

        {/* Claude Desktop */}
        <div style={{ background: '#080808', border: '1px solid #1c1c1c', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>2. Claude Desktop</h4>
            <p style={{ fontSize: '12px', color: '#888888', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Paste the following configuration chunk into your global <code>claude_desktop_config.json</code> server settings block.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#555555', fontFamily: 'monospace' }}>JSON SERVER BLOCK</span>
              <button onClick={() => onCopy(JSON.stringify({"secure-mcp": {"command": "npx", "args": ["-y", "secure-mcp"]}}, null, 2))} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Copy JSON</button>
            </div>
            <pre style={{ background: '#020202', border: '1px solid #111111', borderRadius: '4px', padding: '10px', margin: 0, fontSize: '10px', color: '#00b4d8', fontFamily: 'monospace', whiteSpace: 'pre' }}>
{`"secure-mcp": {
  "command": "npx",
  "args": ["-y", "secure-mcp"]
}`}
            </pre>
          </div>
        </div>

        {/* Custom AI Agents */}
        <div style={{ background: '#080808', border: '1px solid #1c1c1c', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ color: '#ffffff', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>3. Custom AI Agents</h4>
            <p style={{ fontSize: '12px', color: '#888888', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              Connect programmatically using Python SDK's standard client session to secure custom agents.
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '10px', color: '#555555', fontFamily: 'monospace' }}>PYTHON SDK IMPLEMENTATION</span>
              <button onClick={() => onCopy("from mcp import ClientSession\nasync with ClientSession(read, write) as session:\n    await session.initialize()")} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer', padding: 0 }}>Copy Python</button>
            </div>
            <pre style={{ background: '#020202', border: '1px solid #111111', borderRadius: '4px', padding: '10px', margin: 0, fontSize: '9px', color: '#00b4d8', fontFamily: 'monospace', whiteSpace: 'pre' }}>
{`from mcp import ClientSession
async with ClientSession(r, w) as s:
    await s.initialize()`}
            </pre>
          </div>
        </div>
      </div>

      {/* Step 2: Configuration Paths */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Step 2 — Locate Client Config Files
      </h2>
      <p>
        Add the configuration block into the settings file corresponding to your AI assistant application:
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
DATABASE_URL=postgresql+asyncpg://username:password@db-host-domain:5432/database_name
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
