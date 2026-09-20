import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Clock, Key, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DashboardSummary } from '@/types/dashboard';

interface DashboardStatsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--card-bg, #141414)',
              border: '1px solid var(--border, #262626)',
              borderRadius: '10px',
              padding: '20px',
              height: '110px',
              animation: 'pulse 1.5s infinite ease-in-out',
            }}
          />
        ))}
      </div>
    );
  }

  const total = summary?.total_requests ?? 0;
  const blocked = summary?.blocked_count ?? 0;
  const allowed = summary?.allowed_count ?? 0;
  const pendingApprovals = summary?.pending_approvals ?? 0;
  const activeKeys = summary?.active_keys ?? 0;

  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';

  const renderDelta = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return null;
    const isUp = pct > 0;
    const isZero = pct === 0;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: '11px',
        fontWeight: 600,
        color: isZero ? 'var(--muted, #9ca3af)' : isUp ? 'var(--accent, #FFDA62)' : '#10b981',
      }}>
        {isZero ? <Minus size={11} /> : isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        <span>{pct > 0 ? `+${pct}%` : `${pct}%`} vs prior</span>
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Governed Requests',
      value: total.toLocaleString(),
      icon: <Shield size={18} style={{ color: 'var(--accent, #FFDA62)' }} />,
      delta: renderDelta(summary?.deltas.total_pct),
      subtext: 'Intercepted MCP tool calls',
    },
    {
      title: 'Threats & Attacks Blocked',
      value: blocked.toLocaleString(),
      icon: <ShieldAlert size={18} style={{ color: '#ef4444' }} />,
      delta: renderDelta(summary?.deltas.blocked_pct),
      subtext: 'Denied at policy, trust or taint stage',
      highlightBorder: blocked > 0 ? 'rgba(239, 68, 68, 0.3)' : undefined,
    },
    {
      title: 'Allowed Safe Executions',
      value: allowed.toLocaleString(),
      icon: <ShieldCheck size={18} style={{ color: '#10b981' }} />,
      delta: renderDelta(summary?.deltas.allowed_pct),
      subtext: 'Passed policy & guardrails',
    },
    {
      title: 'Block Rate',
      value: `${blockRate}%`,
      icon: <Shield size={18} style={{ color: '#f59e0b' }} />,
      delta: null,
      subtext: `${blocked} of ${total} requests quarantined`,
    },
    {
      title: 'Approvals & Keys',
      value: `${pendingApprovals} pending`,
      icon: <Clock size={18} style={{ color: pendingApprovals > 0 ? '#f59e0b' : 'var(--muted, #9ca3af)' }} />,
      delta: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', color: 'var(--muted, #9ca3af)' }}>
          <Key size={11} />
          <span>{activeKeys} active API key{activeKeys === 1 ? '' : 's'}</span>
        </span>
      ),
      subtext: 'Requires manual human review',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 16,
      marginBottom: 24,
    }}>
      {statCards.map((card, idx) => (
        <div
          key={idx}
          style={{
            background: 'var(--card-bg, #141414)',
            border: `1px solid ${card.highlightBorder || 'var(--border, #262626)'}`,
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10,
            transition: 'border-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-bright, #333333)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = card.highlightBorder || 'var(--border, #262626)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'var(--muted, #9ca3af)',
              letterSpacing: '0.01em',
            }}>
              {card.title}
            </span>
            <div style={{
              padding: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {card.icon}
            </div>
          </div>

          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '26px',
              fontWeight: 700,
              color: 'var(--heading, #ffffff)',
              lineHeight: 1.1,
              marginBottom: 4,
            }}>
              {card.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '18px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted, #888888)' }}>
                {card.subtext}
              </span>
              {card.delta}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
