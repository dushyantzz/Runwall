import React from 'react';
import { ShieldAlert, Wrench, Layers, AlertCircle } from 'lucide-react';
import type { DashboardBreakdown } from '@/types/dashboard';

interface DashboardBreakdownsProps {
  breakdown: DashboardBreakdown | null;
  loading: boolean;
}

export const DashboardBreakdowns: React.FC<DashboardBreakdownsProps> = ({ breakdown, loading }) => {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card-bg, #141414)',
              border: '1px solid var(--border, #262626)',
              borderRadius: '10px',
              padding: '20px',
              height: '220px',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
        ))}
      </div>
    );
  }

  const topRules = breakdown?.top_rules || [];
  const topTools = breakdown?.top_tools || [];
  const stages = breakdown?.stages || [];
  const taintSources = breakdown?.taint_sources || [];

  const maxRuleCount = Math.max(1, ...topRules.map(r => r.count));
  const maxToolCount = Math.max(1, ...topTools.map(t => t.total));
  const maxStageCount = Math.max(1, ...stages.map(s => s.count));
  const maxTaintCount = Math.max(1, ...taintSources.map(t => t.count));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 16,
      marginBottom: 24,
    }}>
      {/* 1. Top Triggered Rules */}
      <div style={{
        background: 'var(--card-bg, #141414)',
        border: '1px solid var(--border, #262626)',
        borderRadius: '10px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <ShieldAlert size={16} style={{ color: '#ef4444' }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--heading, #ffffff)',
            margin: 0,
          }}>
            Top Rules Triggered
          </h3>
        </div>

        {topRules.length === 0 ? (
          <div style={{ color: 'var(--muted, #888888)', fontSize: '13px', margin: 'auto 0' }}>
            No security rules triggered in this period.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topRules.slice(0, 5).map((r, i) => {
              const pct = Math.round((r.count / maxRuleCount) * 100);
              const isDeny = r.decision === 'deny';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--heading, #ffffff)',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {r.rule}
                    </span>
                    <span style={{ color: isDeny ? '#ef4444' : 'var(--accent, #FFDA62)', fontWeight: 600 }}>
                      {r.count}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#222222', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isDeny ? '#ef4444' : 'var(--accent, #FFDA62)',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Top Targeted Tools */}
      <div style={{
        background: 'var(--card-bg, #141414)',
        border: '1px solid var(--border, #262626)',
        borderRadius: '10px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Wrench size={16} style={{ color: 'var(--accent, #FFDA62)' }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--heading, #ffffff)',
            margin: 0,
          }}>
            Most Targeted Tools
          </h3>
        </div>

        {topTools.length === 0 ? (
          <div style={{ color: 'var(--muted, #888888)', fontSize: '13px', margin: 'auto 0' }}>
            No tool invocations recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topTools.slice(0, 5).map((t, i) => {
              const pct = Math.round((t.total / maxToolCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--heading, #ffffff)',
                    }}>
                      {t.tool}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--muted, #9ca3af)' }}>
                      {t.blocked > 0 && <span style={{ color: '#ef4444', marginRight: 6 }}>{t.blocked} blk</span>}
                      {t.total} total
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#222222', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'var(--body, #b4b4b4)',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Pipeline Stages */}
      <div style={{
        background: 'var(--card-bg, #141414)',
        border: '1px solid var(--border, #262626)',
        borderRadius: '10px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Layers size={16} style={{ color: '#3b82f6' }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--heading, #ffffff)',
            margin: 0,
          }}>
            Pipeline Interceptions
          </h3>
        </div>

        {stages.length === 0 ? (
          <div style={{ color: 'var(--muted, #888888)', fontSize: '13px', margin: 'auto 0' }}>
            No stage interceptions recorded.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stages.slice(0, 5).map((s, i) => {
              const pct = Math.round((s.count / maxStageCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                    <span style={{
                      color: 'var(--heading, #ffffff)',
                      textTransform: 'capitalize',
                    }}>
                      {s.stage} stage
                    </span>
                    <span style={{ color: 'var(--body, #b4b4b4)', fontWeight: 600 }}>
                      {s.count}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#222222', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: '#3b82f6',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Taint Sources */}
      <div style={{
        background: 'var(--card-bg, #141414)',
        border: '1px solid var(--border, #262626)',
        borderRadius: '10px',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <AlertCircle size={16} style={{ color: '#f59e0b' }} />
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--heading, #ffffff)',
            margin: 0,
          }}>
            Taint Sources & Provenance
          </h3>
        </div>

        {taintSources.length === 0 ? (
          <div style={{ color: 'var(--muted, #888888)', fontSize: '13px', margin: 'auto 0' }}>
            No tainted sessions or inputs observed.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {taintSources.slice(0, 5).map((t, i) => {
              const pct = Math.round((t.count / maxTaintCount) * 100);
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      color: 'var(--heading, #ffffff)',
                    }}>
                      {t.source}
                    </span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                      {t.count}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#222222', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: '#f59e0b',
                      borderRadius: '2px',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardBreakdowns;
