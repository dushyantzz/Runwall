import React from 'react';
import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import type { TimeRange } from '@/types/dashboard';

interface DashboardHeaderProps {
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onExportCsv: () => void;
  tenantId?: string;
  userEmail?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  range,
  onRangeChange,
  onRefresh,
  refreshing,
  onExportCsv,
  tenantId,
  userEmail,
}) => {
  const ranges: { key: TimeRange; label: string }[] = [
    { key: '24h', label: 'Day (24h)' },
    { key: '7d', label: 'Week (7d)' },
    { key: '30d', label: '30 Days' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 24,
      borderBottom: '1px solid var(--border, #262626)',
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Title & Tenant Badge */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--heading, #ffffff)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              Security Dashboard
            </h1>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'rgba(255, 218, 98, 0.1)',
              border: '1px solid rgba(255, 218, 98, 0.25)',
              color: 'var(--accent, #FFDA62)',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}>
              <ShieldCheck size={12} />
              <span>ACTIVE SHIELD</span>
            </div>
          </div>
          <p style={{
            fontSize: '14px',
            color: 'var(--muted, #9ca3af)',
            margin: 0,
          }}>
            Live zero-trust MCP traffic governance, attack mitigations, and compliance audit {userEmail ? `for ${userEmail}` : ''}{tenantId ? ` (${tenantId})` : ''}
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Time-Range Switcher */}
          <div
            role="group"
            aria-label="Select time range"
            style={{
              display: 'inline-flex',
              background: 'var(--card-bg, #141414)',
              border: '1px solid var(--border, #262626)',
              borderRadius: '8px',
              padding: '3px',
              gap: '2px',
            }}
          >
            {ranges.map((r) => {
              const isActive = range === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => onRangeChange(r.key)}
                  aria-pressed={isActive}
                  style={{
                    background: isActive ? 'var(--accent, #FFDA62)' : 'transparent',
                    color: isActive ? '#000000' : 'var(--body, #b4b4b4)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--body, #b4b4b4)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh Dashboard Data"
            title="Refresh metrics"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--card-bg, #141414)',
              border: '1px solid var(--border, #262626)',
              color: 'var(--body, #b4b4b4)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '13px',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              gap: 6,
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.borderColor = 'var(--border-bright, #333333)';
                e.currentTarget.style.color = '#ffffff';
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing) {
                e.currentTarget.style.borderColor = 'var(--border, #262626)';
                e.currentTarget.style.color = 'var(--body, #b4b4b4)';
              }
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* CSV Export Button */}
          <button
            onClick={onExportCsv}
            aria-label="Export Activity Logs as CSV"
            title="Export sanitized CSV audit logs"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--accent-dim, rgba(255, 218, 98, 0.1))',
              border: '1px solid var(--accent-border, rgba(255, 218, 98, 0.25))',
              color: 'var(--accent, #FFDA62)',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 218, 98, 0.18)';
              e.currentTarget.style.borderColor = 'var(--accent, #FFDA62)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-dim, rgba(255, 218, 98, 0.1))';
              e.currentTarget.style.borderColor = 'var(--accent-border, rgba(255, 218, 98, 0.25))';
            }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
