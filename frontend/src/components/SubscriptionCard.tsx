import React, { useEffect, useState } from 'react';
import { Zap, Crown, Infinity, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface UsageData {
  api_key_id: number;
  tier: string;
  used: number;
  limit: number | null;
  remaining: number;
  is_exceeded: boolean;
  period_start: string;
  period_end: string;
  reset_at: string;
  subscription_status?: string;
}

interface Props {
  apiKeyId: number;
  onUpgradeClick: () => void;
}

const TIER_META: Record<string, { label: string; color: string; icon: React.ReactNode; badge: string }> = {
  free: {
    label: 'Free',
    color: '#777777',
    badge: '#1a1a1a',
    icon: <Zap size={14} />,
  },
  pro: {
    label: 'Pro',
    color: '#FFDA62',
    badge: 'rgba(255,218,98,0.12)',
    icon: <Crown size={14} />,
  },
  enterprise: {
    label: 'Enterprise',
    color: '#3b82f6',
    badge: 'rgba(59,130,246,0.12)',
    icon: <Infinity size={14} />,
  },
};

export default function SubscriptionCard({ apiKeyId, onUpgradeClick }: Props) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!apiKeyId) return;
    fetchUsage();
  }, [apiKeyId]);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/v1/subscription/usage?api_key_id=${apiKeyId}`);
      if (!res.ok) throw new Error('Failed to fetch usage');
      const data = await res.json();
      setUsage(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch {
      return iso;
    }
  };

  const pct = usage && usage.limit
    ? Math.min(100, (usage.used / usage.limit) * 100)
    : 0;

  const tier = usage?.tier || 'free';
  const meta = TIER_META[tier] || TIER_META.free;

  if (loading) {
    return (
      <div style={cardStyle}>
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading usage…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <div style={{ color: 'var(--destructive)', display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
          <AlertCircle size={14} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--heading)', fontWeight: 600, fontSize: 14 }}>Usage</span>
        </div>

        {/* Tier badge */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: meta.badge,
          color: meta.color,
          border: `1px solid ${meta.color}33`,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {meta.icon}
          {meta.label}
        </span>
      </div>

      {/* Usage counters */}
      {usage && (
        <>
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: 'var(--body)', fontSize: 13 }}>
                {tier === 'enterprise' ? 'Unlimited' : `${usage.used.toLocaleString()} / ${usage.limit?.toLocaleString() ?? '∞'} requests`}
              </span>
              {tier !== 'enterprise' && (
                <span style={{ color: usage.is_exceeded ? 'var(--destructive)' : 'var(--muted)', fontSize: 12 }}>
                  {usage.remaining.toLocaleString()} left
                </span>
              )}
            </div>

            {/* Progress bar */}
            {tier !== 'enterprise' && usage.limit && (
              <div style={{
                height: 6,
                background: 'var(--border)',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: usage.is_exceeded
                    ? 'var(--destructive)'
                    : pct > 80
                    ? 'var(--warning)'
                    : 'var(--accent)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            )}
          </div>

          {/* Reset date */}
          {tier !== 'enterprise' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 12 }}>
              <Clock size={11} />
              Resets on {formatDate(usage.reset_at)}
            </div>
          )}

          {/* Rate limit exceeded warning */}
          {usage.is_exceeded && (
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              color: 'var(--destructive)',
              fontSize: 12,
            }}>
              ⚠ Rate limit reached. Your requests are blocked until the period resets.
            </div>
          )}
        </>
      )}

      {/* Upgrade CTA */}
      {tier === 'free' && (
        <button
          onClick={onUpgradeClick}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '9px 0',
            background: 'var(--accent)',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Crown size={13} />
          Upgrade to Pro — ₹7/month
        </button>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '18px 20px',
};
