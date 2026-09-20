import React from 'react';
import { Search, ShieldAlert, ShieldCheck, Clock, AlertTriangle, Eye, Loader2, Sparkles } from 'lucide-react';
import type { SecurityEventItem } from '@/types/dashboard';

interface DashboardActivityFeedProps {
  events: SecurityEventItem[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  decisionFilter: string;
  onDecisionFilterChange: (v: string) => void;
  stageFilter: string;
  onStageFilterChange: (v: string) => void;
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  onSelectEvent: (event: SecurityEventItem) => void;
  onOpenKeysModal: () => void;
}

export const DashboardActivityFeed: React.FC<DashboardActivityFeedProps> = ({
  events,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  decisionFilter,
  onDecisionFilterChange,
  stageFilter,
  onStageFilterChange,
  searchQuery,
  onSearchQueryChange,
  onSelectEvent,
  onOpenKeysModal,
}) => {
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'deny':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <ShieldAlert size={12} />
            <span>BLOCKED</span>
          </span>
        );
      case 'quarantine':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#a855f7',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <AlertTriangle size={12} />
            <span>QUARANTINE</span>
          </span>
        );
      case 'require_approval':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <Clock size={12} />
            <span>APPROVAL</span>
          </span>
        );
      case 'allow':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'rgba(255, 218, 98, 0.15)',
            border: '1px solid rgba(255, 218, 98, 0.3)',
            color: 'var(--accent, #FFDA62)',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            <ShieldCheck size={12} />
            <span>ALLOWED</span>
          </span>
        );
    }
  };

  return (
    <div style={{
      background: 'var(--card-bg, #141414)',
      border: '1px solid var(--border, #262626)',
      borderRadius: '10px',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      {/* Header & Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 20,
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '17px',
            fontWeight: 600,
            color: 'var(--heading, #ffffff)',
            margin: 0,
          }}>
            Live Activity & Decision Feed
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--muted, #9ca3af)' }}>
            Real-time chronological log of intercepted AI agent calls and policy verdicts
          </span>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--muted, #888888)' }} />
            <input
              type="text"
              placeholder="Search tool, reason, agent..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              style={{
                background: '#0d0d0d',
                border: '1px solid var(--border, #262626)',
                borderRadius: '6px',
                padding: '6px 12px 6px 30px',
                fontSize: '12px',
                color: 'var(--heading, #ffffff)',
                width: '190px',
                outline: 'none',
              }}
            />
          </div>

          {/* Decision filter */}
          <select
            value={decisionFilter}
            onChange={(e) => onDecisionFilterChange(e.target.value)}
            style={{
              background: '#0d0d0d',
              border: '1px solid var(--border, #262626)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--body, #b4b4b4)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Decisions</option>
            <option value="deny">Blocked (Deny)</option>
            <option value="allow">Allowed</option>
            <option value="require_approval">Require Approval</option>
            <option value="quarantine">Quarantined</option>
          </select>

          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={(e) => onStageFilterChange(e.target.value)}
            style={{
              background: '#0d0d0d',
              border: '1px solid var(--border, #262626)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '12px',
              color: 'var(--body, #b4b4b4)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">All Stages</option>
            <option value="policy">Policy (OPA)</option>
            <option value="trust">Tool Trust</option>
            <option value="rate_limit">Rate Limit</option>
            <option value="auth">Auth & Key</option>
            <option value="taint">Taint Analysis</option>
            <option value="risk">Risk Scorer</option>
          </select>
        </div>
      </div>

      {/* Events Table / List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              style={{
                height: '52px',
                background: '#0f0f0f',
                borderRadius: '6px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }}
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'rgba(255, 255, 255, 0.01)',
          borderRadius: '8px',
          border: '1px dashed var(--border, #262626)',
        }}>
          <Sparkles size={36} style={{ color: 'var(--accent, #FFDA62)', margin: '0 auto 12px' }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--heading, #ffffff)',
            marginBottom: 6,
          }}>
            No security events found
          </h3>
          <p style={{
            fontSize: '13px',
            color: 'var(--muted, #9ca3af)',
            maxWidth: '420px',
            margin: '0 auto 16px',
          }}>
            Connect your Claude Code, Cursor, or custom MCP client using an API key to begin routing and governing calls through Runwall.
          </p>
          <button
            onClick={onOpenKeysModal}
            style={{
              background: 'var(--accent, #FFDA62)',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create API Key
          </button>
        </div>
      ) : (
        /* Event Table */
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border, #262626)',
                color: 'var(--muted, #888888)',
                textAlign: 'left',
              }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Decision</th>
                <th style={{ padding: '10px 12px' }}>Tool / Action</th>
                <th style={{ padding: '10px 12px' }}>Stage</th>
                <th style={{ padding: '10px 12px' }}>Reason & Rule</th>
                <th style={{ padding: '10px 12px' }}>Risk</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => {
                const isBlocked = ev.decision === 'deny' || ev.decision === 'quarantine';
                return (
                  <tr
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    style={{
                      borderBottom: '1px solid #1a1a1a',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono, monospace)', color: 'var(--muted, #9ca3af)' }}>
                      {new Date(ev.ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </td>

                    {/* Decision */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {getDecisionBadge(ev.decision)}
                    </td>

                    {/* Tool */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 600,
                        color: 'var(--heading, #ffffff)',
                      }}>
                        {ev.tool_name || ev.action || 'system'}
                      </span>
                    </td>

                    {/* Stage */}
                    <td style={{ padding: '10px 12px', color: 'var(--body, #b4b4b4)', textTransform: 'capitalize' }}>
                      {ev.stage || 'policy'}
                    </td>

                    {/* Reason & Rule */}
                    <td style={{ padding: '10px 12px', maxWidth: '280px' }}>
                      <div style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: isBlocked ? '#fca5a5' : 'var(--body, #b4b4b4)',
                      }}>
                        {ev.reason || ev.rule_id || 'Policy evaluation completed'}
                      </div>
                      {ev.rule_id && (
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10px',
                          color: 'var(--muted, #888888)',
                        }}>
                          rule: {ev.rule_id}
                        </span>
                      )}
                    </td>

                    {/* Risk */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      {ev.risk_score !== null ? (
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: (ev.risk_score || 0) >= 0.7 ? '#ef4444' : (ev.risk_score || 0) >= 0.4 ? '#f59e0b' : '#10b981',
                        }}>
                          {((ev.risk_score || 0) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted, #666666)' }}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border, #262626)',
                          color: 'var(--muted, #9ca3af)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.borderColor = 'var(--border-bright, #333333)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--muted, #9ca3af)';
                          e.currentTarget.style.borderColor = 'var(--border, #262626)';
                        }}
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Keyset Pagination Load More */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              background: 'var(--card-bg, #141414)',
              border: '1px solid var(--border, #262626)',
              borderRadius: '6px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--heading, #ffffff)',
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!loadingMore) e.currentTarget.style.borderColor = 'var(--border-bright, #333333)';
            }}
            onMouseLeave={(e) => {
              if (!loadingMore) e.currentTarget.style.borderColor = 'var(--border, #262626)';
            }}
          >
            {loadingMore && <Loader2 size={14} className="animate-spin" />}
            <span>{loadingMore ? 'Loading older events...' : 'Load More Activity'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardActivityFeed;
