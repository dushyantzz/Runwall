import React from 'react';
import { 
  ReactFlow, 
  Background, 
  Position,
  MarkerType,
  Handle
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Shield, Database, GitBranch, MessageSquare, Lock, Key, 
  AlertTriangle, FileText, Zap, ShieldCheck, Clock, Terminal, 
  UserCheck, EyeOff, ClipboardList
} from 'lucide-react';

// Import actual SVG assets from the codebase
import cursorLogo from '../assets/cursor.svg';
import claudeLogo from '../assets/claude_code.svg';
import copilotLogo from '../assets/copilot.svg';
import codexLogo from '../assets/codex.svg';

// Custom Salesforce logo matching the website icon
const SalesforceLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3c-1.2 0-2.4.4-3.4 1.2-1-1.3-2.5-2.2-4.3-2.2C1.9 2 0 3.9 0 6.2c0 .4.1.8.2 1.2C.1 8 0 8.7 0 9.5 0 13.1 3 16 6.6 16c.4 0 .9-.1 1.3-.2 1.1 1.4 2.8 2.2 4.7 2.2 2 0 3.8-.9 4.9-2.4.4.1.8.2 1.2.2 3.6 0 6.6-2.9 6.6-6.5 0-.7-.1-1.4-.3-2.1.8-.8 1.3-1.9 1.3-3.1 0-2.3-1.9-4.2-4.3-4.2-1.8 0-3.3.9-4.3 2.2C14.4 3.4 13.2 3 12 3z" />
  </svg>
);

// --- Custom Agent Node Component ---
const AgentNode = ({ data }: { data: { label: string; iconSrc: string; status: string } }) => {
  return (
    <div style={{
      padding: '16px 22px',
      background: 'rgba(10, 10, 12, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 218, 98, 0.35)',
      borderRadius: '12px',
      boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 218, 98, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
      color: '#e2e8f0',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      minWidth: 260,
      position: 'relative',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }} className="agent-flow-node trending-floating-1">
      <div style={{
        background: '#121212',
        border: '1px solid #222222',
        borderRadius: '8px',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img 
          src={data.iconSrc} 
          alt={data.label} 
          style={{ width: 24, height: 24, display: 'block', objectFit: 'contain' }} 
        />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{data.label}</div>
        <div style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          {data.status}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent)', border: 'none', width: 8, height: 8 }} />
    </div>
  );
};

// --- Custom Runwall Security Core Node (Large features box matching Kubric layout) ---
const RunwallCoreNode = () => {
  const features = [
    { label: 'OAuth & Token Auth', icon: <Key size={14} /> },
    { label: 'Policy Engine (OPA)', icon: <ShieldCheck size={14} /> },
    { label: 'Risk Analysis Core', icon: <AlertTriangle size={14} /> },
    { label: 'Audit Log & Replay', icon: <FileText size={14} /> },
    { label: 'Rate Limits & Caps', icon: <Zap size={14} /> },
    { label: 'MCP Protocol Broker', icon: <Lock size={14} /> },
    { label: 'Taint Tracking & DLP', icon: <EyeOff size={14} /> },
    { label: 'Approval Workflows', icon: <UserCheck size={14} /> },
    { label: 'Sandbox Execution', icon: <Terminal size={14} /> },
    { label: 'Threat Interception', icon: <Shield size={14} /> },
    { label: 'SLA Governance', icon: <Clock size={14} /> },
    { label: 'M2M Verification', icon: <ClipboardList size={14} /> }
  ];

  return (
    <div style={{
      width: 480,
      height: 500,
      background: 'rgba(4, 4, 6, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 218, 98, 0.45)',
      borderRadius: '12px',
      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 218, 98, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
      padding: '30px 24px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-body)',
      transition: 'all 0.4s ease'
    }} className="core-flow-box">
      {/* Handles for connections */}
      <Handle type="target" position={Position.Left} style={{ background: 'var(--accent)', border: 'none', width: 10, height: 10 }} />
      <Handle type="source" position={Position.Right} style={{ background: 'var(--accent)', border: 'none', width: 10, height: 10 }} />

      {/* Header with Runwall Shield and Text */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28,
        paddingBottom: 16,
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(255, 218, 98, 0.25)'
        }}>
          <img 
            src="/logo.svg" 
            alt="Runwall Shield" 
            style={{ width: 26, height: 26, objectFit: 'contain' }} 
          />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 21,
            fontWeight: 850,
            color: '#ffffff',
            letterSpacing: '0.01em',
            lineHeight: 1.1
          }}>
            Runwall
          </div>
          <div style={{
            fontSize: 9,
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginTop: 4
          }}>
            AI Governance & Security Core
          </div>
        </div>
      </div>

      {/* 12 Core Features Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        flexGrow: 1
      }}>
        {features.map((feat, index) => (
          <div 
            key={index}
            style={{
              padding: '12px 14px',
              background: 'rgba(15, 15, 18, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="core-feature-card"
          >
            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}>
              {feat.icon}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>{feat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Custom External Tool Node Component ---
const ToolNode = ({ data }: { data: { label: string; icon: React.ReactNode; type: 'secure' | 'warning' | 'blocked'; desc: string } }) => {
  const styles = {
    secure: {
      border: '1px solid rgba(255, 218, 98, 0.35)',
      shadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 218, 98, 0.08)',
      iconBg: '#121212',
      iconBorder: '#222222',
      iconColor: 'var(--accent)',
      statusColor: 'var(--accent)',
      status: 'Allowed'
    },
    warning: {
      border: '1px solid rgba(245, 158, 11, 0.4)',
      shadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.08)',
      iconBg: '#121212',
      iconBorder: '#222222',
      iconColor: '#f59e0b',
      statusColor: '#f59e0b',
      status: 'Audited'
    },
    blocked: {
      border: '1px solid rgba(239, 68, 68, 0.45)',
      shadow: '0 12px 36px rgba(220, 38, 38, 0.1), 0 0 20px rgba(239, 68, 68, 0.12)',
      iconBg: 'rgba(239, 68, 68, 0.05)',
      iconBorder: 'rgba(239, 68, 68, 0.2)',
      iconColor: '#ef4444',
      statusColor: '#ef4444',
      status: 'Blocked'
    }
  }[data.type];

  return (
    <div style={{
      padding: '16px 22px',
      background: 'rgba(10, 10, 12, 0.75)',
      backdropFilter: 'blur(12px)',
      border: styles.border,
      borderRadius: '12px',
      boxShadow: styles.shadow,
      color: '#e2e8f0',
      fontFamily: 'var(--font-body)',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      minWidth: 260,
      position: 'relative',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
    }} className="tool-flow-node trending-floating-2">
      <Handle type="target" position={Position.Left} style={{ background: styles.statusColor, border: 'none', width: 8, height: 8 }} />
      <div style={{
        background: styles.iconBg,
        border: `1px solid ${styles.iconBorder}`,
        borderRadius: '8px',
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: styles.iconColor
      }}>
        {data.icon}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{data.label}</div>
        <div style={{ fontSize: 12, color: styles.statusColor, display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontFamily: 'var(--font-mono)' }}>
          <span style={{ width: 6, height: 6, background: styles.statusColor, borderRadius: '50%', display: 'inline-block' }} />
          {styles.status} • <span style={{ color: '#777777' }}>{data.desc}</span>
        </div>
      </div>
    </div>
  );
};

// --- Custom Label Node Component (Removes Default Handles) ---
const LabelNode = ({ data }: { data: { label: string } }) => {
  return (
    <div style={{
      color: 'var(--accent)',
      fontFamily: 'var(--font-mono)',
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: '0.25em',
      textTransform: 'uppercase',
      padding: '4px 0',
      width: '320px'
    }}>
      {data.label}
    </div>
  );
};

// Node types mapping
const nodeTypes = {
  agent: AgentNode,
  core: RunwallCoreNode,
  tool: ToolNode,
  label: LabelNode,
};

export default function RunwallFlowDiagram() {
  const initialNodes: Node[] = [
    // --- Group Labels (Mathematically Centered Symmetrically) ---
    {
      id: 'label-agents',
      type: 'label',
      position: { x: 50, y: 15 },
      data: { label: 'AI AGENTS' },
      selectable: false
    },
    {
      id: 'label-core',
      type: 'label',
      position: { x: 430, y: 15 },
      data: { label: 'MCP SECURITY GATEWAY' },
      selectable: false
    },
    {
      id: 'label-tools',
      type: 'label',
      position: { x: 1020, y: 15 },
      data: { label: 'EXTERNAL TOOLS & APIs' },
      selectable: false
    },

    // --- Left Column: AI Agents (Symmetrical x: 50, 4 Nodes with 115px vertical spacing) ---
    {
      id: 'agent-1',
      type: 'agent',
      position: { x: 50, y: 80 },
      data: { label: 'Claude', iconSrc: claudeLogo, status: 'Connected via MCP' },
    },
    {
      id: 'agent-2',
      type: 'agent',
      position: { x: 50, y: 195 },
      data: { label: 'Autonomous Developer', iconSrc: cursorLogo, status: 'Token validated' },
    },
    {
      id: 'agent-3',
      type: 'agent',
      position: { x: 50, y: 310 },
      data: { label: 'Sales Support Bot', iconSrc: copilotLogo, status: 'Active session' },
    },
    {
      id: 'agent-4',
      type: 'agent',
      position: { x: 50, y: 425 },
      data: { label: 'Codex', iconSrc: codexLogo, status: 'Session initialized' },
    },

    // --- Center Column: Large Runwall Governance Box (Centered at x: 430, y: 60) ---
    {
      id: 'core-gate',
      type: 'core',
      position: { x: 430, y: 60 },
      data: {},
      selectable: false
    },

    // --- Right Column: External Tools (Symmetrical x: 1020, aligned perfectly with Agents Y) ---
    {
      id: 'tool-github',
      type: 'tool',
      position: { x: 1020, y: 80 },
      data: { label: 'GitHub API', icon: <GitBranch size={22} />, type: 'secure', desc: 'Secure commit' },
    },
    {
      id: 'tool-db',
      type: 'tool',
      position: { x: 1020, y: 195 },
      data: { label: 'Prod Database', icon: <Database size={22} />, type: 'warning', desc: 'Query control' },
    },
    {
      id: 'tool-slack',
      type: 'tool',
      position: { x: 1020, y: 310 },
      data: { label: 'Slack Webhook', icon: <MessageSquare size={22} />, type: 'secure', desc: 'Message sent' },
    },
    {
      id: 'tool-crm',
      type: 'tool',
      position: { x: 1020, y: 425 },
      data: { label: 'Salesforce CRM', icon: <SalesforceLogo />, type: 'blocked', desc: 'Sensitive leak' },
    },
  ];

  const initialEdges: Edge[] = [
    // Agent Connections to Core (Accent colored, animated dashes)
    {
      id: 'edge-agent1-core',
      source: 'agent-1',
      target: 'core-gate',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FFDA62' }
    },
    {
      id: 'edge-agent2-core',
      source: 'agent-2',
      target: 'core-gate',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FFDA62' }
    },
    {
      id: 'edge-agent3-core',
      source: 'agent-3',
      target: 'core-gate',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FFDA62' }
    },
    {
      id: 'edge-agent4-core',
      source: 'agent-4',
      target: 'core-gate',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FFDA62' }
    },

    // Core verification routing to tools
    // 1. GitHub: Secure path (Allowed - Accent)
    {
      id: 'edge-core-github',
      source: 'core-gate',
      target: 'tool-github',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FFDA62' }
    },
    // 2. Database: Warning / Audit path (Audited - Yellow)
    {
      id: 'edge-core-db',
      source: 'core-gate',
      target: 'tool-db',
      animated: true,
      style: { stroke: '#f59e0b', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }
    },
    // 3. Slack: Secure notifications (Allowed - Accent)
    {
      id: 'edge-core-slack',
      source: 'core-gate',
      target: 'tool-slack',
      animated: true,
      style: { stroke: 'var(--accent)', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#FFDA62' }
    },
    // 4. CRM: Blocked sensitive execution (Blocked - Red/Destructive)
    {
      id: 'edge-core-crm',
      source: 'core-gate',
      target: 'tool-crm',
      style: { stroke: '#ef4444', strokeWidth: 2.5, strokeDasharray: '4 4' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
    },
  ];

  // Mobile-friendly static representation
  const mobileAgents = [
    { label: 'Claude Code', color: '#FFDA62' },
    { label: 'Cursor', color: '#FFDA62' },
    { label: 'GitHub Copilot', color: '#FFDA62' },
    { label: 'OpenAI Codex', color: '#FFDA62' },
  ];
  const mobileTools = [
    { label: 'GitHub API', color: '#FFDA62', status: 'Allowed' },
    { label: 'Prod Database', color: '#f59e0b', status: 'Audited' },
    { label: 'Slack Webhook', color: '#FFDA62', status: 'Allowed' },
    { label: 'Salesforce CRM', color: '#ef4444', status: 'Blocked' },
  ];
  const mobileFeatures = [
    'Policy Engine (OPA)', 'Identity & Access Control', 'Risk Scoring Engine',
    'Taint Tracking & DLP', 'Approval Workflows', 'Audit Log & Replay',
    'MCP Protocol Broker', 'Sandbox Execution', 'Rate Limits & Caps',
    'Rollback Actions', 'SLA Governance', 'M2M Verification',
  ];

  return (
    <>
      {/* ── DESKTOP: Full ReactFlow Diagram ── */}
      <div className="flow-diagram-desktop" style={{
        width: '100%',
        height: '640px',
        background: 'radial-gradient(circle at 50% 50%, #030303 0%, #000000 100%)',
        border: '1px solid #121212',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0,0,0,0.85)',
        animation: 'fade-in 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div className="grid-overlay" style={{ opacity: 0.22, pointerEvents: 'none' }} />

        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 20,
          pointerEvents: 'none'
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(10,10,12,0.85)',
            border: '1px solid #1a1a1a',
            borderRadius: 6,
            padding: '10px 28px',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)'
          }}>
            Runwall: The governance layer between your agents and your tools
          </div>
        </div>

        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.05 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnDrag={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#121212" gap={20} size={1.2} />
        </ReactFlow>
      </div>

      {/* ── MOBILE: Static vertical stacked diagram ── */}
      <div className="flow-diagram-mobile" style={{
        flexDirection: 'column',
        gap: 0,
        width: '100%',
        background: 'radial-gradient(circle at 50% 20%, #060606 0%, #000000 100%)',
        border: '1px solid #1a1a1a',
        borderRadius: '12px',
        overflow: 'hidden',
        padding: '24px 16px',
      }}>
        {/* AI Agents column */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
            AI AGENTS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {mobileAgents.map((agent, i) => (
              <div key={i} style={{
                background: 'rgba(10,10,12,0.85)',
                border: '1px solid rgba(255,218,98,0.25)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-display)' }}>{agent.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Arrow down */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', color: 'var(--accent)' }}>
          <svg width="24" height="40" viewBox="0 0 24 40" fill="none" style={{ overflow: 'visible' }}>
            <path 
              d="M12 0 L12 34" 
              stroke="rgba(255, 218, 98, 0.15)" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M12 0 L12 34" 
              stroke="var(--accent)" 
              strokeWidth="2" 
              strokeDasharray="6 6" 
              strokeLinecap="round"
              className="flowing-dash-mobile"
            />
            <path 
              d="M6 28 L12 34 L18 28" 
              stroke="var(--accent)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Runwall Core */}
        <div style={{
          background: 'rgba(4,4,6,0.9)',
          border: '1px solid rgba(255,218,98,0.45)',
          borderRadius: 10,
          padding: '16px',
          marginBottom: 4,
          boxShadow: '0 0 24px rgba(255,218,98,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.svg" alt="Runwall" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '0.01em' }}>Runwall</div>
              <div style={{ fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>MCP Security Gateway</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {mobileFeatures.map((feat, i) => (
              <div key={i} style={{
                padding: '8px 10px',
                background: 'rgba(15,15,18,0.7)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 6,
                fontSize: 11,
                color: '#f0f0f0',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Animated Arrow down */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', color: 'var(--accent)' }}>
          <svg width="24" height="40" viewBox="0 0 24 40" fill="none" style={{ overflow: 'visible' }}>
            <path 
              d="M12 0 L12 34" 
              stroke="rgba(255, 218, 98, 0.15)" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
            <path 
              d="M12 0 L12 34" 
              stroke="var(--accent)" 
              strokeWidth="2" 
              strokeDasharray="6 6" 
              strokeLinecap="round"
              className="flowing-dash-mobile"
            />
            <path 
              d="M6 28 L12 34 L18 28" 
              stroke="var(--accent)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* External Tools */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#888', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
            EXTERNAL TOOLS & APIs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {mobileTools.map((tool, i) => (
              <div key={i} style={{
                background: 'rgba(10,10,12,0.85)',
                border: `1px solid ${tool.color === '#ef4444' ? 'rgba(239,68,68,0.35)' : tool.color === '#f59e0b' ? 'rgba(245,158,11,0.35)' : 'rgba(255,218,98,0.25)'}`,
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: tool.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-display)' }}>{tool.label}</div>
                  <div style={{ fontSize: 10, color: tool.color, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{tool.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <div style={{ textAlign: 'center', marginTop: 20, padding: '10px 16px', background: 'rgba(10,10,12,0.7)', border: '1px solid #1a1a1a', borderRadius: 6 }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Runwall: The governance layer between your agents and your tools
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }

        .trending-floating-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        .trending-floating-2 {
          animation: float-2 6s ease-in-out infinite;
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(4px); }
        }

        .core-shield-pulse {
          animation: shield-glow 2.5s infinite ease-in-out;
        }
        @keyframes shield-glow {
          0%, 100% {
            filter: drop-shadow(0 0 2px rgba(255, 218, 98, 0.3));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 8px rgba(255, 218, 98, 0.7));
            transform: scale(1.05);
          }
        }

        .agent-flow-node:hover {
          border-color: var(--accent) !important;
          box-shadow: 0 0 35px rgba(255, 218, 98, 0.25) !important;
          background: #0f0f12 !important;
        }
        
        .core-feature-card:hover {
          border-color: var(--accent) !important;
          background: #18181f !important;
          box-shadow: 0 4px 12px rgba(255, 218, 98, 0.05);
          transform: scale(1.02);
        }

        .core-flow-box:hover {
          border-color: var(--accent) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(255, 218, 98, 0.12) !important;
        }

        .tool-flow-node:hover {
          border-color: var(--accent) !important;
          box-shadow: 0 0 35px rgba(255, 218, 98, 0.15) !important;
          background: #0f0f12 !important;
        }
        .tool-flow-node[style*="rgba(239, 68, 68"]:hover {
          border-color: #ef4444 !important;
          box-shadow: 0 0 35px rgba(239, 68, 68, 0.2) !important;
        }

        .flowing-dash-mobile {
          animation: flow-down-dash 1.2s linear infinite;
        }
        @keyframes flow-down-dash {
          from {
            stroke-dashoffset: 12;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        .react-flow__node-default {
          padding: 0 !important;
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </>
  );
}
