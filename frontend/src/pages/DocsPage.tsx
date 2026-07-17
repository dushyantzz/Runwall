import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronRight, ChevronDown, Search,
  Info,
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
  { id: 'features', label: 'Core Features' }
];

export default function DocsPage() {
  const { pageId = 'introduction' } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'getting-started': true,
    'features': true
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
    {
      id: 'functions',
      title: 'Functions',
      category: 'getting-started',
      component: <FunctionsDoc />
    },
    {
      id: 'agent-integration',
      title: 'Agent Integration',
      category: 'getting-started',
      component: <AgentIntegrationDoc />
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
    { id: 'sandboxing-execution-profiles', title: 'Sandboxing / Exec Profiles', icon: Box, category: 'features', component: <SandboxingExecutionProfiles /> }
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

function QuickStartDoc({ onCopy }: { onCopy: (t: string) => void }) {
  const mcpConfig = `{
  "mcpServers": {
    "runwall": {
      "command": "npx",
      "args": ["-y", "@runwall/mcp"],
      "env": {
        "RUNWALL_API_KEY": "<your-api-key>",
        "RUNWALL_URL": "https://calm-cloud-km6b6.run.mcp-use.com/mcp"
      }
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
        Configure the Runwall gateway and hook it up to your favorite AI agent clients in seconds.
      </p>

      {/* Step 1: Gateway Configuration */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Step 1 — Choose Connection Method
      </h2>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#b4b4b4' }}>
        Depending on your AI assistant client, select either the Stdio configuration block or the direct HTTPS connection URL.
      </p>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent, #FFDA62)', marginTop: '8px', marginBottom: '8px' }}>
        Option A — Stdio / Local Configuration (Recommended for Cursor, Claude Desktop, Cline)
      </h3>
      <p style={{ fontSize: '13px', color: '#b4b4b4', marginBottom: '8px' }}>
        Copy the following JSON configuration and replace <code>&lt;your-api-key&gt;</code> with your Runwall API Key:
      </p>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy(mcpConfig)}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1c1c1c'}
        >
          Copy Config
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>{mcpConfig}</code>
        </pre>
      </div>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent, #FFDA62)', marginTop: '20px', marginBottom: '8px' }}>
        Option B — Direct HTTPS / Raw URL (For Claude Code & clients only accepting raw HTTP/SSE links)
      </h3>
      <p style={{ fontSize: '13px', color: '#b4b4b4', marginBottom: '8px' }}>
        If your agent only takes a raw URL and does not support JSON configs or local binaries, supply the API key directly in the URL query string:
      </p>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => onCopy("https://calm-cloud-km6b6.run.mcp-use.com/mcp?token=<your-api-key>")}
          style={{
            position: 'absolute', right: '12px', top: '12px',
            background: '#1c1c1c', border: '1px solid #333', borderRadius: '4px',
            color: '#fff', padding: '4px 8px', fontSize: '11px', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2a'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1c1c1c'}
        >
          Copy Link
        </button>
        <pre style={{
          background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
          padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
        }}>
          <code>https://calm-cloud-km6b6.run.mcp-use.com/mcp?token=&lt;your-api-key&gt;</code>
        </pre>
      </div>

      {/* Step 2: Configuration Paths */}
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginTop: '16px' }}>
        Step 2 — Locate Client Config Files & Paste
      </h2>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#b4b4b4' }}>
        Open the MCP configuration file corresponding to your AI assistant application and paste the copied block into the main JSON structure:
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
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Claude Desktop / Claude Code</strong></td>
            <td style={{ padding: '10px 12px' }}><code>%APPDATA%\Claude\claude_desktop_config.json</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Cline (VS Code)</strong></td>
            <td style={{ padding: '10px 12px' }}><code>%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Windsurf</strong></td>
            <td style={{ padding: '10px 12px' }}><code>~/.codeium/windsurf/mcp_config.json</code></td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>Trae / Qoder / Copilot</strong></td>
            <td style={{ padding: '10px 12px' }}>Configure via the Trae / Qoder / Copilot MCP Settings panel (select <strong>command</strong> / stdio transport)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '10px 12px', color: '#fff' }}><strong>KIRO / Codex / Custom Agents</strong></td>
            <td style={{ padding: '10px 12px' }}>HTTP POST to the remote URL gateway endpoint using your custom API Key</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

/* ── B.2 FUNCTIONS DOC ── */
function FunctionsDoc() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="functions">
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--heading, #ffffff)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}>
        Functions
      </h1>

      <p style={{ fontSize: '16px', lineHeight: '1.7' }}>
        Runwall MCP exposes administrative tools, utility target functions, prompts, and resources. Here is a complete breakdown of each function and its security purpose:
      </p>

      {/* Category A: Governance & Administrative Tools */}
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', marginTop: '16px', marginBottom: '8px' }}>
        🔒 Governance & Administrative Tools (Admin Privileges Required)
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', lineHeight: '1.6', textAlign: 'left', marginBottom: '16px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600, width: '220px' }}>Function / Tool Name</th>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600, width: '220px' }}>Why it is there</th>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>manage_policy</code></td>
            <td>To customize governance rules.</td>
            <td>Allows admins to perform CRUD operations on execution policies (allow/deny rules) directly through the MCP interface.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>explore_audit_logs</code></td>
            <td>For compliance and security review.</td>
            <td>Fetches chronological execution history logs, showing which tools were called, execution duration, and caller identities.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>get_decision_logs</code></td>
            <td>To inspect policy evaluation context.</td>
            <td>Retrieves a list of historical policy decisions (ALLOW/DENY/APPROVAL) with complete context snapshots for explanation.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>view_tool_inventory</code></td>
            <td>To audit registered tool properties.</td>
            <td>Lists all tools currently registered with the FastMCP server, showing their parameter schemas and metadata.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>rollback_action</code></td>
            <td>To undo unsafe write operations.</td>
            <td>Triggers compensating transactions to revert state changes made by modifying tools (uses ReversibleExecutionLog).</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>approve_tool_trust_state</code></td>
            <td>To verify trust of external tools.</td>
            <td>Enables administrators to elevate or lower a tool's verification status, bypassing strict runtime checks.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>get_pending_approvals</code></td>
            <td>For human-in-the-loop workflows.</td>
            <td>Lists tool calls flagged as high-risk that are waiting for human authorization before they can proceed.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>review_approval</code></td>
            <td>To authorize flagged tool calls.</td>
            <td>Lets managers approve or reject a pending tool execution request with a logged justification.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>deploy_policy_version</code></td>
            <td>To roll out policy changes.</td>
            <td>Deploys new OPA/Rego policy packages to the policy evaluation engine with custom rollout ratios.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>run_policy_simulation</code></td>
            <td>To dry-run rules.</td>
            <td>Evaluates Rego policies against simulated payloads to confirm correctness before deploying them.</td>
          </tr>
        </tbody>
      </table>

      {/* Category B: Utility & Standard Tools */}
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', marginTop: '24px', marginBottom: '8px' }}>
        ⚙️ Utility & Playground Tools (Low-Risk Target Tools)
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', lineHeight: '1.6', textAlign: 'left', marginBottom: '16px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600, width: '220px' }}>Function / Tool Name</th>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600, width: '220px' }}>Why it is there</th>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>ping</code></td>
            <td>For connection keep-alives.</td>
            <td>Performs a quick server availability check, returning a standard "pong" response.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>echo</code></td>
            <td>To verify input parameters.</td>
            <td>Echoes back input strings. Used to check that interceptors are correctly receiving client parameters.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>calculator</code></td>
            <td>To test input risk scoring.</td>
            <td>Evaluates math expressions. Used to test how the Risk Engine blocks SQL/system injections inside equations.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>text_processor</code></td>
            <td>To test basic manipulation.</td>
            <td>Transforms text (uppercase, word count). Acts as a standard data processing tool for agents.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>secure_hash</code></td>
            <td>To verify integrity of payloads.</td>
            <td>Calculates SHA-256 or MD5 hashes of input text to verify data integrity.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>uuid_generator</code></td>
            <td>To create unique identifiers.</td>
            <td>Generates UUID v1 or v4 strings for session ids or tracking variables.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>datetime_info</code></td>
            <td>To provide time context.</td>
            <td>Returns the current time in ISO or readable string format to assist agent scheduling.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>system_info</code></td>
            <td>To demonstrate role enforcement.</td>
            <td>Returns server resource stats. Requires Admin roles, allowing testing of guest-vs-admin permissions.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>context_summary</code></td>
            <td>To inspect current session state.</td>
            <td>Fetches session metadata, tenant constraints, and current rate limits for the active agent.</td>
          </tr>
        </tbody>
      </table>

      {/* Category C: Prompts & Resources */}
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', marginTop: '24px', marginBottom: '8px' }}>
        📝 Prompts & Resources (Telemetry & Templates)
      </h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', lineHeight: '1.6', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #222' }}>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600, width: '220px' }}>Function / Resource Name</th>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600, width: '220px' }}>Why it is there</th>
            <th style={{ padding: '8px', color: '#fff', fontWeight: 600 }}>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>security-audit</code> <span style={{ fontSize: '10px', color: '#888' }}>(Prompt)</span></td>
            <td>To trigger automated audits.</td>
            <td>Provides a pre-configured LLM prompt template populated with recent security logs to analyze threat trends.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>performance-analysis</code> <span style={{ fontSize: '10px', color: '#888' }}>(Prompt)</span></td>
            <td>To analyze performance stats.</td>
            <td>Provides a prompt template populated with CPU/Memory metrics to analyze performance bottlenecks.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>get_server_config</code> <span style={{ fontSize: '10px', color: '#888' }}>(Resource)</span></td>
            <td>To read live config parameters.</td>
            <td>Exposes settings values (timeout, session limit) to the dashboard for system validation.</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #141414' }}>
            <td style={{ padding: '8px', color: '#fff' }}><code>get_metrics</code> <span style={{ fontSize: '10px', color: '#888' }}>(Resource)</span></td>
            <td>To read real-time telemetry.</td>
            <td>Exposes live performance metrics (request rates, error counts) for real-time monitoring.</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}

/* ── B.3 AGENT INTEGRATION DOC ── */
function AgentIntegrationDoc() {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} id="agent-integration">
      <h1 style={{
        fontSize: '32px',
        fontWeight: 600,
        color: 'var(--heading, #ffffff)',
        fontFamily: 'var(--font-display)',
        letterSpacing: '-0.02em',
      }}>
        Agentic Framework Integration
      </h1>

      <p style={{ fontSize: '16px', lineHeight: '1.7' }}>
        Learn how to configure the Runwall MCP governance gateway inside popular AI agent frameworks including LangChain, LangGraph, CrewAI, AutoGen, and custom Python/TypeScript agents.
      </p>

      {/* LangChain (Python) */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        🐍 LangChain / LangGraph (Python)
      </h3>
      <p style={{ fontSize: '14px', color: '#b4b4b4', lineHeight: '1.6' }}>
        Integrate the Runwall remote gateway into your LangChain workflow using the standard MCP client bridge:
      </p>
      <pre style={{
        background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
        padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
      }}>
        <code>{`from langchain_openai import ChatOpenAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 1. Define Runwall connection parameters
server_params = StdioServerParameters(
    command="npx",
    args=["-y", "@runwall/mcp"],
    env={
        "RUNWALL_API_KEY": "YOUR_API_KEY",
        "RUNWALL_URL": "https://calm-cloud-km6b6.run.mcp-use.com/mcp"
    }
)

# 2. Establish governor channel and fetch tools
async with stdio_client(server_params) as (read_stream, write_stream):
    async with ClientSession(read_stream, write_stream) as session:
        await session.initialize()
        tools = await session.list_tools()
        
        # Bind governance-wrapped tools to LLM
        llm = ChatOpenAI(model="gpt-4o").bind_tools(tools)`}</code>
      </pre>

      {/* CrewAI */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        🚀 CrewAI
      </h3>
      <p style={{ fontSize: '14px', color: '#b4b4b4', lineHeight: '1.6' }}>
        Expose Runwall tools to your CrewAI agents. CrewAI automatically leverages tool descriptions and schemas to invoke them safely:
      </p>
      <pre style={{
        background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
        padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
      }}>
        <code>{`from crewai import Agent, Crew, Task
from crewai.tools import tool
import httpx

@tool("Runwall Tool Runner")
def runwall_tool(tool_name: str, arguments: dict) -> str:
    """Executes a tool securely routed through the Runwall governance gateway."""
    headers = {"Authorization": "Bearer YOUR_API_KEY"}
    payload = {
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments}
    }
    res = httpx.post("https://calm-cloud-km6b6.run.mcp-use.com/mcp", json=payload, headers=headers)
    return res.text

# Define Governed Security Agent
security_agent = Agent(
    role="Database Administrator",
    goal="Safely query and mutate database records",
    backstory="An automated DBA operating strictly under enterprise security rules.",
    tools=[runwall_tool],
    verbose=True
)`}</code>
      </pre>

      {/* Microsoft AutoGen */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        🤖 Microsoft AutoGen
      </h3>
      <p style={{ fontSize: '14px', color: '#b4b4b4', lineHeight: '1.6' }}>
        Register Runwall's remote MCP tools to an AutoGen Conversational Agent:
      </p>
      <pre style={{
        background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
        padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
      }}>
        <code>{`import autogen
import httpx

# Configure LLM Client
config_list = [{"model": "gpt-4", "api_key": "YOUR_OPENAI_KEY"}]
assistant = autogen.AssistantAgent(name="governed_assistant", llm_config={"config_list": config_list})
user_proxy = autogen.UserProxyAgent(name="user_proxy", code_execution_config=False)

# Register tool on AutoGen agent
@user_proxy.register_for_execution()
@assistant.register_for_llm(description="Secure math calculator governed by Runwall policies")
def calculator(expression: str) -> str:
    headers = {"Authorization": "Bearer YOUR_API_KEY"}
    payload = {"method": "tools/call", "params": {"name": "calculator", "arguments": {"expression": expression}}}
    res = httpx.post("https://calm-cloud-km6b6.run.mcp-use.com/mcp", json=payload, headers=headers)
    return res.json().get("result", {}).get("content", [{}])[0].get("text", "Error")`}</code>
      </pre>

      {/* Custom JS/TS Agents */}
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginTop: '12px' }}>
        ⚡ LangChain (TypeScript) & Custom JS Agents
      </h3>
      <p style={{ fontSize: '14px', color: '#b4b4b4', lineHeight: '1.6' }}>
        Integrate using the official Model Context Protocol TypeScript SDK:
      </p>
      <pre style={{
        background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: '6px',
        padding: '16px', overflowX: 'auto', fontSize: '13px', fontFamily: 'var(--font-mono)'
      }}>
        <code>{`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// 1. Establish SSE Transport with API Key header
const transport = new SSEClientTransport(
  new URL("https://calm-cloud-km6b6.run.mcp-use.com/sse"),
  {
    eventSourceInitDict: {
      headers: {
        Authorization: "Bearer YOUR_API_KEY",
      },
    },
  }
);

// 2. Initialize Client and list tools
const client = new Client({ name: "runwall-client", version: "1.0.0" });
await client.connect(transport);
const tools = await client.listTools();
console.log("Governed Tools Loaded:", tools);`}</code>
      </pre>
    </article>
  );
}

