import React, { useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, Clock, Copy, Check } from 'lucide-react';
import type { SecurityEventItem } from '@/types/dashboard';

interface DashboardEventDrawerProps {
  event: SecurityEventItem | null;
  onClose: () => void;
}

export const DashboardEventDrawer: React.FC<DashboardEventDrawerProps> = ({ event, onClose }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isBlocked = event.decision === 'deny' || event.decision === 'quarantine';
  const isPending = event.decision === 'require_approval';

  const formatJson = (val: any) => {
    if (!val) return 'None';
    if (typeof val === 'string') {
      try {
        return JSON.stringify(JSON.parse(val), null, 2);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val, null, 2);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Security Audit Event Detail ${event.id}`}
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          background: '#0d0d0d',
          borderLeft: '1px solid var(--border, #262626)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.8)',
          overflowY: 'auto',
          animation: 'slide-left 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border, #262626)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: '#0d0d0d',
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isBlocked ? (
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
              }}>
                <ShieldAlert size={20} />
              </div>
            ) : isPending ? (
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                display: 'flex',
              }}>
                <Clock size={20} />
              </div>
            ) : (
              <div style={{
                padding: '6px',
                borderRadius: '6px',
                background: 'rgba(255, 218, 98, 0.15)',
                color: 'var(--accent, #FFDA62)',
                display: 'flex',
              }}>
                <ShieldCheck size={20} />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--heading, #ffffff)',
                  margin: 0,
                }}>
                  Event #{event.id}
                </h2>
                <span style={{
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: isBlocked ? 'rgba(239, 68, 68, 0.2)' : isPending ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 218, 98, 0.2)',
                  color: isBlocked ? '#ef4444' : isPending ? '#f59e0b' : 'var(--accent, #FFDA62)',
                }}>
                  {event.decision}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--muted, #9ca3af)' }}>
                {new Date(event.ts).toUTCString()}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close details"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted, #9ca3af)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted, #9ca3af)'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Reason Banner */}
          {event.reason && (
            <div style={{
              background: isBlocked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${isBlocked ? 'rgba(239, 68, 68, 0.25)' : 'var(--border, #262626)'}`,
              borderRadius: '8px',
              padding: '14px 16px',
              fontSize: '13px',
              lineHeight: 1.5,
              color: isBlocked ? '#fca5a5' : 'var(--heading, #ffffff)',
            }}>
              <strong style={{ display: 'block', marginBottom: 2, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Governance Verdict
              </strong>
              {event.reason}
            </div>
          )}

          {/* Key Attributes */}
          <div style={{
            background: 'var(--card-bg, #141414)',
            border: '1px solid var(--border, #262626)',
            borderRadius: '8px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            fontSize: '12px',
          }}>
            <div>
              <span style={{ color: 'var(--muted, #888888)', display: 'block', marginBottom: 2 }}>Target Tool</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--heading, #ffffff)', fontWeight: 600 }}>
                {event.tool_name || 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted, #888888)', display: 'block', marginBottom: 2 }}>Interception Stage</span>
              <span style={{ color: 'var(--heading, #ffffff)', textTransform: 'capitalize' }}>
                {event.stage || 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted, #888888)', display: 'block', marginBottom: 2 }}>Policy Rule ID</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent, #FFDA62)' }}>
                {event.rule_id || 'default_policy'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted, #888888)', display: 'block', marginBottom: 2 }}>Evaluation Engine</span>
              <span style={{ color: 'var(--heading, #ffffff)' }}>
                {event.engine || 'opa'} (mode: {event.mode})
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted, #888888)', display: 'block', marginBottom: 2 }}>Risk Score / Level</span>
              <span style={{ color: (event.risk_score || 0) >= 0.7 ? '#ef4444' : 'var(--heading, #ffffff)', fontWeight: 600 }}>
                {event.risk_score !== null ? `${(event.risk_score * 100).toFixed(0)}/100 (${event.risk_level || 'standard'})` : 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted, #888888)', display: 'block', marginBottom: 2 }}>Processing Latency</span>
              <span style={{ color: 'var(--heading, #ffffff)' }}>
                {event.latency_ms !== null ? `${event.latency_ms} ms` : '< 1 ms'}
              </span>
            </div>
          </div>

          {/* Redacted Tool Arguments (Rendered safely as text in pre/code) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading, #ffffff)' }}>
                Redacted Arguments Snapshot
              </span>
              <button
                onClick={() => copyToClipboard(formatJson(event.args_redacted), 'args')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted, #9ca3af)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '11px',
                }}
              >
                {copiedField === 'args' ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
                <span>{copiedField === 'args' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre style={{
              background: '#070707',
              border: '1px solid var(--border, #262626)',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#d4d4d4',
              overflowX: 'auto',
              maxHeight: '200px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              margin: 0,
            }}>
              <code>{formatJson(event.args_redacted)}</code>
            </pre>
            {event.args_hash && (
              <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--muted, #888888)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>HMAC-SHA256 Hash:</span>
                <code style={{ color: 'var(--body, #b4b4b4)' }}>{event.args_hash}</code>
              </div>
            )}
          </div>

          {/* Rule Snapshot */}
          {event.rule_snapshot && (
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading, #ffffff)', display: 'block', marginBottom: 6 }}>
                Rule Snapshot at Decision Time
              </span>
              <pre style={{
                background: '#070707',
                border: '1px solid var(--border, #262626)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#d4d4d4',
                overflowX: 'auto',
                maxHeight: '160px',
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}>
                <code>{formatJson(event.rule_snapshot)}</code>
              </pre>
            </div>
          )}

          {/* Taint Labels */}
          {event.taint_labels && event.taint_labels.length > 0 && (
            <div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--heading, #ffffff)', display: 'block', marginBottom: 6 }}>
                Taint Labels & Provenance
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {event.taint_labels.map((label, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(245, 158, 11, 0.12)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Identity & Technical Trace */}
          <div style={{
            borderTop: '1px solid var(--border, #262626)',
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontSize: '11px',
            color: 'var(--muted, #888888)',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Request ID:</span>
              <span style={{ color: 'var(--body, #b4b4b4)' }}>{event.request_id}</span>
            </div>
            {event.session_id && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Session ID:</span>
                <span style={{ color: 'var(--body, #b4b4b4)' }}>{event.session_id}</span>
              </div>
            )}
            {event.client_ip && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Client IP:</span>
                <span style={{ color: 'var(--body, #b4b4b4)' }}>{event.client_ip}</span>
              </div>
            )}
            {event.principal && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Principal:</span>
                <span style={{ color: 'var(--body, #b4b4b4)' }}>{event.principal}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEventDrawer;
