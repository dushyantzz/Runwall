import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, ShieldAlert, ShieldCheck, 
  Play, RefreshCw, AlertTriangle, CheckCircle, 
  Plus, Settings, Database, Clock, Server, Activity
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export default function PlaygroundConsole({ title }: { title: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Common notification helper
  const notify = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // -------------------------------------------------------------------------
  // 1. Identity & Access Control State
  // -------------------------------------------------------------------------
  const [users, setUsers] = useState<any[]>([]);

  const fetchIdentityData = async () => {
    setLoading(true);
    try {
      const uRes = await fetch(`${API_BASE}/dashboard/identity/users`);
      if (uRes.ok) setUsers(await uRes.json());
    } catch (err: any) {
      setError('Could not connect to FastAPI server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 2. Tenant Management State
  // -------------------------------------------------------------------------
  const [tenants, setTenants] = useState<any[]>([]);
  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/tenants`);
      if (res.ok) setTenants(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 3. Tool Registry State
  // -------------------------------------------------------------------------
  const [tools, setTools] = useState<any[]>([]);
  const fetchTools = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/tools`);
      if (res.ok) setTools(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 4. Policy Engine State
  // -------------------------------------------------------------------------
  const [policies, setPolicies] = useState<any[]>([]);
  const [regoCode, setRegoCode] = useState(`package runwall.tools
default allow := false

# Allow if developer and risk < 0.5
allow if {
    input.agent.role == "developer"
    input.risk_score < 0.5
}`);
  const [policyVersion, setPolicyVersion] = useState('v1.1.0');
  const [policySimulation, setPolicySimulation] = useState(true);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/policies`);
      if (res.ok) setPolicies(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeployPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/policies/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: policyVersion,
          rego_content: regoCode,
          is_active: true,
          is_simulation_mode: policySimulation,
          rollout_percentage: 100
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify('success', `Policy bundle ${policyVersion} deployed successfully.`);
        fetchPolicies();
      } else {
        notify('error', data.detail || 'Failed to deploy policy.');
      }
    } catch (err) {
      notify('error', 'Network error deploying policy.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 5. Runtime Interceptor State
  // -------------------------------------------------------------------------
  const [simTool, setSimTool] = useState('salesforce_api');
  const [simParams, setSimParams] = useState('{"action": "update", "value": 5000}');
  const [simRole, setSimRole] = useState('developer');
  const [simSession, setSimSession] = useState('session-sim-abc');
  const [simResult, setSimResult] = useState<any>(null);

  const handleSimulateInterceptor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(simParams);
      } catch (pe) {
        notify('error', 'Invalid JSON parameters.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/dashboard/interceptor/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: simTool,
          parameters: parsed,
          role: simRole,
          session_id: simSession
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSimResult(data);
        notify('success', 'Interception simulation complete.');
      } else {
        notify('error', data.detail || 'Simulation failed.');
      }
    } catch (err) {
      notify('error', 'Network error simulating interceptor.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 6. Risk Scorer State
  // -------------------------------------------------------------------------
  const [riskTool, setRiskTool] = useState('jira_api');
  const [riskParams, setRiskParams] = useState('{"action": "delete_all", "confirm": true}');
  const [riskRole, setRiskRole] = useState('developer');
  const [riskResult, setRiskResult] = useState<any>(null);

  const handleComputeRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let parsed = {};
      try {
        parsed = JSON.parse(riskParams);
      } catch (pe) {
        notify('error', 'Invalid JSON parameters.');
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/dashboard/risk/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: riskTool,
          parameters: parsed,
          role: riskRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRiskResult(data);
        notify('success', 'Risk calculation complete.');
      } else {
        notify('error', data.detail || 'Risk calculation failed.');
      }
    } catch (err) {
      notify('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 7. Taint Tracking State
  // -------------------------------------------------------------------------
  const [taintSessions, setTaintSessions] = useState<any[]>([]);
  const [newTaintSession, setNewTaintSession] = useState('session-sim-abc');
  const [newTaintLabel, setNewTaintLabel] = useState('EXTERNAL_WEB');

  const fetchTaintSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/taint/sessions`);
      if (res.ok) setTaintSessions(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaintSession || !newTaintLabel) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/taint/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: newTaintSession,
          label: newTaintLabel
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify('success', `Taint label '${newTaintLabel}' added.`);
        fetchTaintSessions();
      } else {
        notify('error', data.detail || 'Failed to add taint.');
      }
    } catch (err) {
      notify('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 8. Approvals Inbox State
  // -------------------------------------------------------------------------
  const [approvals, setApprovals] = useState<any[]>([]);
  const [reviewReason, setReviewReason] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals`);
      if (res.ok) setApprovals(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApproval = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    if (!reviewReason) {
      notify('error', 'Please provide a review reason/justification.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/approvals/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reason: reviewReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify('success', `Request has been ${decision.toLowerCase()}.`);
        setReviewReason('');
        fetchApprovals();
      } else {
        notify('error', data.detail || 'Review failed.');
      }
    } catch (err) {
      notify('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 9. Audit Trail State
  // -------------------------------------------------------------------------
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [policyLogs, setPolicyLogs] = useState<any[]>([]);
  const [auditTab, setAuditTab] = useState<'decisions' | 'executions'>('decisions');

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const dRes = await fetch(`${API_BASE}/audit/decisions`);
      const eRes = await fetch(`${API_BASE}/audit/logs`);
      if (dRes.ok) setPolicyLogs(await dRes.json());
      if (eRes.ok) setAuditLogs(await eRes.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 10. Rollbacks State
  // -------------------------------------------------------------------------
  const [rollbackLogs, setRollbackLogs] = useState<any[]>([]);

  const fetchRollbackLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/rollback/logs`);
      if (res.ok) setRollbackLogs(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRollback = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/rollback/${id}/trigger`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        notify('success', 'Execution successfully rolled back.');
        fetchRollbackLogs();
      } else {
        notify('error', data.detail || 'Rollback failed.');
      }
    } catch (err) {
      notify('error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 11. Quotas State
  // -------------------------------------------------------------------------
  const [quotas, setQuotas] = useState<any>(null);
  const fetchQuotas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/quotas/limits`);
      if (res.ok) setQuotas(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 12. Sandboxing State
  // -------------------------------------------------------------------------
  const [sandboxProfiles, setSandboxProfiles] = useState<any[]>([]);
  const fetchSandboxProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard/sandboxing/profiles`);
      if (res.ok) setSandboxProfiles(await res.json());
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Orchestrate Initial Fetch based on title
  // -------------------------------------------------------------------------
  useEffect(() => {
    setError(null);
    if (title === 'Identity & Access Control') fetchIdentityData();
    else if (title === 'Tenant Management') fetchTenants();
    else if (title === 'Tool & MCP Registry') fetchTools();
    else if (title === 'Policy Engine') fetchPolicies();
    else if (title === 'Taint Tracking Engine') fetchTaintSessions();
    else if (title === 'Approval Workflow Engine') fetchApprovals();
    else if (title === 'Audit, Evidence & Replay') fetchAuditData();
    else if (title === 'Rollback & Compensating Controls') fetchRollbackLogs();
    else if (title === 'Quotas, Budgets & Rate Limits') fetchQuotas();
    else if (title === 'Sandboxing & Execution Profiles') fetchSandboxProfiles();
  }, [title]);

  return (
    <section className="section section-border-top" style={{ background: '#050505', borderBottom: '1px solid #333333' }}>
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <span className="mono-label" style={{ color: 'var(--accent)', display: 'block', marginBottom: 6 }}>Live Control Plane Dashboard</span>
            <h3 style={{ color: '#ffffff', fontWeight: 300, fontSize: '1.5rem', margin: 0 }}>Interactive Console</h3>
          </div>
          <button 
            onClick={() => {
              if (title === 'Identity & Access Control') fetchIdentityData();
              else if (title === 'Tenant Management') fetchTenants();
              else if (title === 'Tool & MCP Registry') fetchTools();
              else if (title === 'Policy Engine') fetchPolicies();
              else if (title === 'Taint Tracking Engine') fetchTaintSessions();
              else if (title === 'Approval Workflow Engine') fetchApprovals();
              else if (title === 'Audit, Evidence & Replay') fetchAuditData();
              else if (title === 'Rollback & Compensating Controls') fetchRollbackLogs();
              else if (title === 'Quotas, Budgets & Rate Limits') fetchQuotas();
              else if (title === 'Sandboxing & Execution Profiles') fetchSandboxProfiles();
            }}
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Global Notifications */}
        {notification && (
          <div style={{
            background: notification.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
            borderRadius: 6,
            padding: '10px 16px',
            fontSize: 13,
            color: notification.type === 'success' ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {notification.type === 'success' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {notification.text}
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: 16,
            fontSize: 13,
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20
          }}>
            <AlertTriangle size={16} />
            <div>
              <strong>Service Offline:</strong> {error}
            </div>
          </div>
        )}



        {/* -------------------------------------------------------------------
            1. IDENTITY & ACCESS CONTROL
            ------------------------------------------------------------------- */}
        {title === 'Identity & Access Control' && (
          <div>

            {/* Users / Identities list */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Users size={14} color="var(--accent)" /> Registered Identities
              </h4>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#777777', textAlign: 'left', borderBottom: '1px solid #333333' }}>
                    <th style={{ padding: '8px 0' }}>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ color: '#ffffff', borderBottom: '1px solid #111' }}>
                      <td style={{ padding: '10px 0', fontWeight: 500 }}>{u.username}</td>
                      <td style={{ color: '#777777' }}>{u.email}</td>
                      <td>
                        <span style={{ fontSize: 10, background: u.is_admin ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', color: u.is_admin ? '#a78bfa' : '#b4b4b4', padding: '2px 6px', borderRadius: 4 }}>
                          {u.is_admin ? 'Administrator' : 'Developer'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#10b981', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            2. TENANT MANAGEMENT
            ------------------------------------------------------------------- */}
        {title === 'Tenant Management' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Server size={14} color="var(--accent)" /> Active Multi-Tenant Workspaces
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {tenants.map(t => (
                <div key={t.id} style={{ border: '1px solid #1c1c1c', borderRadius: 6, padding: 16, background: '#050505', position: 'relative' }}>
                  <span style={{ fontSize: 9, background: t.tier === 'Enterprise' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: t.tier === 'Enterprise' ? '#10b981' : '#777777', padding: '2px 6px', borderRadius: 4, position: 'absolute', top: 12, right: 12, fontWeight: 600 }}>
                    {t.tier}
                  </span>
                  <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 500, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: '#777777' }}>ID: <code>{t.id}</code></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                    <button onClick={() => notify('success', `Synced policies for ${t.id}`)} style={{ flex: 1, background: '#141414', border: '1px solid #1c1c1c', color: '#ffffff', padding: '5px 0', borderRadius: 4, fontSize: 10, cursor: 'pointer' }}>
                      Sync Policies
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            3. TOOL & MCP REGISTRY
            ------------------------------------------------------------------- */}
        {title === 'Tool & MCP Registry' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Shield size={14} color="var(--accent)" /> Verified Tool Signatures Manifest
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {tools.map(tool => {
                const isTrusted = tool.trust_status === 'TRUSTED';
                return (
                  <div key={tool.tool_name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, border: '1px solid #333333', borderRadius: 6, background: '#050505', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: isTrusted ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${isTrusted ? '#10b981' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isTrusted ? <ShieldCheck size={14} color="#10b981" /> : <ShieldAlert size={14} color="#ef4444" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>{tool.tool_name}</div>
                      <div style={{ fontSize: 10, color: '#777777' }}>Hash: <code>{tool.description_hash}</code> • Ver: {tool.version}</div>
                    </div>
                    <span style={{ fontSize: 9, background: isTrusted ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: isTrusted ? '#10b981' : '#ef4444', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                      {tool.trust_status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            4. POLICY ENGINE
            ------------------------------------------------------------------- */}
        {title === 'Policy Engine' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
            {/* Deploy Form */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Plus size={14} color="var(--accent)" /> Author Rego Policy Bundle
              </h4>
              <form onSubmit={handleDeployPolicy} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Bundle Version</label>
                  <input 
                    type="text" 
                    placeholder="e.g. v1.2.0" 
                    value={policyVersion} 
                    onChange={e => setPolicyVersion(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Rego Source Code</label>
                  <textarea 
                    rows={8}
                    value={regoCode} 
                    onChange={e => setRegoCode(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#ffffff', resize: 'vertical' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    id="sim-mode"
                    checked={policySimulation}
                    onChange={e => setPolicySimulation(e.target.checked)}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <label htmlFor="sim-mode" style={{ fontSize: 12, color: '#b4b4b4', cursor: 'pointer' }}>Deploy in Simulation/Dry-Run Mode</label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 13 }} disabled={loading}>
                  Deploy & Activate Bundle
                </button>
              </form>
            </div>

            {/* Active Policies */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Shield size={14} color="var(--accent)" /> Deployed Policy Versions
              </h4>
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 300 }}>
                {policies.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#777777', padding: 20, textAlign: 'center' }}>
                    No deployed bundles loaded from DB. Displaying active Rego fallback default engine.
                  </div>
                ) : (
                  policies.map(p => (
                    <div key={p.id} style={{ border: '1px solid #333333', borderRadius: 6, padding: 12, marginBottom: 8, background: '#050505' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>Version {p.version}</span>
                        <span style={{ fontSize: 9, background: p.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: p.is_active ? '#10b981' : '#777777', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                          {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#777777' }}>
                        Simulation Mode: <code>{p.is_simulation_mode ? 'true' : 'false'}</code> • Created: {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            5. RUNTIME INTERCEPTOR
            ------------------------------------------------------------------- */}
        {title === 'Runtime Interceptor' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
            {/* Input Config */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Play size={14} color="var(--accent)" /> Simulate Agent Tool Call
              </h4>
              <form onSubmit={handleSimulateInterceptor} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Tool Name</label>
                  <select 
                    value={simTool} 
                    onChange={e => setSimTool(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                  >
                    <option value="jira_api">jira_api</option>
                    <option value="salesforce_api">salesforce_api</option>
                    <option value="delete_database">delete_database</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Parameters (JSON)</label>
                  <textarea 
                    rows={3}
                    value={simParams} 
                    onChange={e => setSimParams(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#ffffff' }}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Caller Role</label>
                    <select 
                      value={simRole} 
                      onChange={e => setSimRole(e.target.value)}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#ffffff' }}
                    >
                      <option value="developer">Developer</option>
                      <option value="security-lead">Security Lead</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Session ID</label>
                    <input 
                      type="text" 
                      value={simSession} 
                      onChange={e => setSimSession(e.target.value)}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#ffffff' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 13 }} disabled={loading}>
                  Run Governance Interceptor
                </button>
              </form>
            </div>

            {/* Results Console */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Activity size={14} color="var(--accent)" /> Interception Decision Output
              </h4>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!simResult ? (
                  <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 40 }}>
                    Click "Run Governance Interceptor" to execute policy pipeline checks.
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    {/* Allow/Deny Banner */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: simResult.decision === 'allow' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${simResult.decision === 'allow' ? '#10b981' : '#ef4444'}`,
                      borderRadius: 6,
                      padding: 12,
                      marginBottom: 16
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: simResult.decision === 'allow' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', fontWeight: 'bold', fontSize: 11 }}>
                        {simResult.decision === 'allow' ? '✓' : '✕'}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: simResult.decision === 'allow' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                          DECISION: {simResult.decision}
                        </div>
                        <div style={{ fontSize: 11, color: '#777777' }}>{simResult.explanation}</div>
                      </div>
                    </div>

                    {/* Metadata JSON */}
                    <pre style={{ margin: 0, padding: 12, background: '#050505', border: '1px solid #333333', borderRadius: 6, fontSize: 11, overflowX: 'auto', color: '#b4b4b4', maxHeight: 180 }}>
                      <code>{JSON.stringify(simResult, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            6. RISK SCORING ENGINE
            ------------------------------------------------------------------- */}
        {title === 'Risk Scoring Engine' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 16 }}>
            {/* Form inputs */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Settings size={14} color="var(--accent)" /> Risk Calculator Inputs
              </h4>
              <form onSubmit={handleComputeRisk} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Tool Name</label>
                  <input 
                    type="text" 
                    value={riskTool} 
                    onChange={e => setRiskTool(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Call Arguments (JSON)</label>
                  <textarea 
                    rows={3}
                    value={riskParams} 
                    onChange={e => setRiskParams(e.target.value)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#ffffff' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Caller Role / Scope</label>
                  <select 
                    value={riskRole} 
                    onChange={e => setRiskRole(e.target.value)}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 12, color: '#ffffff' }}
                  >
                    <option value="developer">Developer</option>
                    <option value="security-lead">Security Lead</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 13 }} disabled={loading}>
                  Compute Composite Risk Score
                </button>
              </form>
            </div>

            {/* Risk Gauge Result */}
            <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Activity size={14} color="var(--accent)" /> Risk Calculation Output
              </h4>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {!riskResult ? (
                  <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 40 }}>
                    Click "Compute Composite Risk Score" to execute risk model evaluation.
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    {/* Score display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                      <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: '#0a0a0a', border: '1px solid #333333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: riskResult.risk_level === 'high' ? '#ef4444' : riskResult.risk_level === 'medium' ? '#f59e0b' : '#10b981' }}>
                          {riskResult.risk_score.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#777777', fontWeight: 600, textTransform: 'uppercase' }}>Composite Risk Rating</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', textTransform: 'capitalize' }}>
                          {riskResult.risk_level} Risk
                        </div>
                        <span style={{ fontSize: 11, color: '#777777' }}>{riskResult.explanation}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: '#141414', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                      <div style={{
                        width: `${riskResult.risk_score * 100}%`,
                        height: '100%',
                        background: riskResult.risk_level === 'high' ? '#ef4444' : riskResult.risk_level === 'medium' ? '#f59e0b' : '#10b981',
                        transition: 'width 0.3s ease-out'
                      }} />
                    </div>

                    {/* Risk Factors */}
                    <span style={{ fontSize: 11, color: '#777777', display: 'block', marginBottom: 8, fontWeight: 600 }}>Multi-Factor Score Weights</span>
                    <pre style={{ margin: 0, padding: 12, background: '#050505', border: '1px solid #333333', borderRadius: 6, fontSize: 11, color: '#b4b4b4' }}>
                      <code>{JSON.stringify(riskResult.factors, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            7. TAINT TRACKING ENGINE
            ------------------------------------------------------------------- */}
        {title === 'Taint Tracking Engine' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              {/* Add Taint */}
              <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
                <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Plus size={14} color="var(--accent)" /> Inject Session Taint Label
                </h4>
                <form onSubmit={handleAddTaint} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Target Session ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. session-sim-abc" 
                      value={newTaintSession} 
                      onChange={e => setNewTaintSession(e.target.value)}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Taint Label Category</label>
                    <select 
                      value={newTaintLabel} 
                      onChange={e => setNewTaintLabel(e.target.value)}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                      required
                    >
                      <option value="EXTERNAL_WEB">EXTERNAL_WEB (Untrusted HTTP payload)</option>
                      <option value="PII_DATA">PII_DATA (Contains customer private details)</option>
                      <option value="UNTRUSTED_LLM">UNTRUSTED_LLM (Unverified prompt text)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 13 }} disabled={loading}>
                    Add Taint Label
                  </button>
                </form>
              </div>

              {/* Tainted Sessions */}
              <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Shield size={14} color="var(--accent)" /> Active Session Taint States
                </h4>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: 220 }}>
                  {taintSessions.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 20 }}>No active session taint records.</div>
                  ) : (
                    taintSessions.map(s => (
                      <div key={s.id} style={{ padding: '10px', border: '1px solid #333333', borderRadius: 6, marginBottom: 8, background: '#050505' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#ffffff', fontWeight: 600 }}>{s.id}</span>
                          <span style={{ fontSize: 9, background: s.taints.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: s.taints.length > 0 ? '#ef4444' : '#10b981', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                            {s.taints.length > 0 ? 'TAINTED' : 'CLEAN'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {s.taints.length === 0 ? (
                            <span style={{ fontSize: 10, color: '#777777' }}>No taint tags applied</span>
                          ) : (
                            s.taints.map((t: string) => (
                              <span key={t} style={{ fontSize: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '1px 6px', borderRadius: 3 }}>
                                {t}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            8. APPROVAL WORKFLOW ENGINE
            ------------------------------------------------------------------- */}
        {title === 'Approval Workflow Engine' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Clock size={14} color="var(--accent)" /> Pending Approvals Inbox
            </h4>
            
            {approvals.length === 0 ? (
              <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 40 }}>
                No pending approval requests. High-risk writes triggered by agents will stage here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {approvals.map(req => (
                  <div key={req.id} style={{ border: '1px solid #333333', borderRadius: 6, padding: 16, background: '#050505' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>Request <code>{req.id}</code></div>
                        <div style={{ fontSize: 11, color: 'var(--accent)' }}>Tool Invocation: <code>{req.tool_name}</code></div>
                      </div>
                      <span style={{ fontSize: 10, color: '#777777' }}>Staged: {new Date(req.created_at).toLocaleTimeString()}</span>
                    </div>

                    <div style={{ marginBottom: 12, fontSize: 11, color: '#777777', background: '#000000', padding: 8, borderRadius: 4, border: '1px solid #111' }}>
                      <strong>Context Snapshot:</strong>
                      <pre style={{ margin: '4px 0 0 0', color: '#b4b4b4' }}>
                        <code>{JSON.stringify(req.context, null, 2)}</code>
                      </pre>
                    </div>

                    {/* Review Form */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Provide review reason/justification..." 
                        value={reviewReason} 
                        onChange={e => setReviewReason(e.target.value)}
                        style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '6px 12px', fontSize: 12, color: '#ffffff' }}
                      />
                      <button onClick={() => handleReviewApproval(req.id, 'APPROVED')} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 11, background: '#10b981', color: '#000000' }} disabled={loading}>
                        Approve
                      </button>
                      <button onClick={() => handleReviewApproval(req.id, 'REJECTED')} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11, color: '#ef4444', borderColor: '#ef4444' }} disabled={loading}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            9. AUDIT, EVIDENCE & REPLAY
            ------------------------------------------------------------------- */}
        {title === 'Audit, Evidence & Replay' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333333', marginBottom: 16 }}>
              <button 
                onClick={() => setAuditTab('decisions')}
                style={{
                  background: 'none', border: 'none',
                  color: auditTab === 'decisions' ? 'var(--accent)' : '#777777',
                  borderBottom: auditTab === 'decisions' ? '2px solid var(--accent)' : 'none',
                  padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}
              >
                Policy Decisions Log
              </button>
              <button 
                onClick={() => setAuditTab('executions')}
                style={{
                  background: 'none', border: 'none',
                  color: auditTab === 'executions' ? 'var(--accent)' : '#777777',
                  borderBottom: auditTab === 'executions' ? '2px solid var(--accent)' : 'none',
                  padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500
                }}
              >
                Tool Execution Audit Trail
              </button>
            </div>

            {/* Table wrapper */}
            <div style={{ overflowX: 'auto', maxHeight: 300 }}>
              {auditTab === 'decisions' ? (
                policyLogs.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 20 }}>No policy decisions logged.</div>
                ) : (
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#777777', borderBottom: '1px solid #333333' }}>
                        <th style={{ padding: '8px 0' }}>Timestamp</th>
                        <th>User ID</th>
                        <th>Decision</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policyLogs.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid #111', color: '#ffffff' }}>
                          <td style={{ padding: '8px 0', color: '#777777' }}>{new Date(l.created_at).toLocaleTimeString()}</td>
                          <td><code>{l.user_id || 'M2M_API'}</code></td>
                          <td>
                            <span style={{ fontSize: 10, fontWeight: 700, color: l.decision === 'allow' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                              {l.decision}
                            </span>
                          </td>
                          <td style={{ color: '#b4b4b4' }}>{l.explanation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : (
                auditLogs.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 20 }}>No execution logs recorded.</div>
                ) : (
                  <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ color: '#777777', borderBottom: '1px solid #333333' }}>
                        <th style={{ padding: '8px 0' }}>Timestamp</th>
                        <th>Tool Name</th>
                        <th>Action</th>
                        <th>Duration</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid #111', color: '#ffffff' }}>
                          <td style={{ padding: '8px 0', color: '#777777' }}>{new Date(l.created_at).toLocaleTimeString()}</td>
                          <td><code>{l.tool_name}</code></td>
                          <td>{l.action}</td>
                          <td>{l.execution_time_ms.toFixed(1)} ms</td>
                          <td>
                            <span style={{ fontSize: 10, color: l.status === 'success' ? '#10b981' : '#ef4444' }}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            10. ROLLBACK & COMPENSATING CONTROLS
            ------------------------------------------------------------------- */}
        {title === 'Rollback & Compensating Controls' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Clock size={14} color="var(--accent)" /> Reversible Execution Logs
            </h4>
            {rollbackLogs.length === 0 ? (
              <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 30 }}>
                No reversible actions currently stored. (Execute reversible tools in integration tests to generate).
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rollbackLogs.map(log => {
                  const isCommitted = log.status === 'committed';
                  return (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid #333333', borderRadius: 6, background: '#050505', gap: 16 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}><code>{log.id}</code></span>
                          <span style={{ fontSize: 9, background: isCommitted ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)', color: isCommitted ? '#10b981' : '#777777', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                            {log.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#777777', marginTop: 4 }}>
                          Executed: <code>{log.tool_name}</code> • Compensator: <code>{log.compensation_handler}</code>
                        </div>
                      </div>
                      {isCommitted && (
                        <button onClick={() => handleTriggerRollback(log.id)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 11, color: '#ef4444', borderColor: '#ef4444' }} disabled={loading}>
                          Trigger Rollback
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            11. QUOTAS, BUDGETS & RATE LIMITS
            ------------------------------------------------------------------- */}
        {title === 'Quotas, Budgets & Rate Limits' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Activity size={14} color="var(--accent)" /> Rate Throttling Status
            </h4>
            {quotas ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div style={{ background: '#050505', border: '1px solid #333333', borderRadius: 6, padding: 16 }}>
                  <div style={{ fontSize: 10, color: '#777777', textTransform: 'uppercase', marginBottom: 4 }}>Tenant RPM Limit</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff' }}>{quotas.default_tenant_rpm}</div>
                  <span style={{ fontSize: 10, color: '#10b981' }}>Quota healthy</span>
                </div>
                <div style={{ background: '#050505', border: '1px solid #333333', borderRadius: 6, padding: 16 }}>
                  <div style={{ fontSize: 10, color: '#777777', textTransform: 'uppercase', marginBottom: 4 }}>Current Load TPH</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff' }}>{quotas.current_tph}</div>
                  <span style={{ fontSize: 10, color: '#777777' }}>Transactions/hour</span>
                </div>
                <div style={{ background: '#050505', border: '1px solid #333333', borderRadius: 6, padding: 16 }}>
                  <div style={{ fontSize: 10, color: '#777777', textTransform: 'uppercase', marginBottom: 4 }}>Throttled Status</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: quotas.is_throttled ? '#ef4444' : '#10b981' }}>
                    {quotas.is_throttled ? 'ACTIVE' : 'NONE'}
                  </div>
                  <span style={{ fontSize: 10, color: '#777777' }}>Adaptive shielding</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 20 }}>No limit details.</div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            12. SANDBOXING & EXECUTION PROFILES
            ------------------------------------------------------------------- */}
        {title === 'Sandboxing & Execution Profiles' && (
          <div style={{ border: '1px solid #333333', borderRadius: 8, padding: 20, background: '#000000' }}>
            <h4 style={{ color: '#ffffff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Database size={14} color="var(--accent)" /> Sandbox Isolation Profiles
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sandboxProfiles.map(p => (
                <div key={p.profile_name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid #333333', borderRadius: 6, background: '#050505', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#ffffff', fontWeight: 600 }}>{p.profile_name}</span>
                      <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#777777', marginTop: 4 }}>
                      Isolation: {p.isolation_type} • Memory Limit: {p.max_memory_mb} MB • Max CPU: {p.max_cpu_percent}% • Internet: {p.allow_network ? 'Allowed' : 'Blocked'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
