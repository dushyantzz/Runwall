import React from 'react';
import { Key, Plus, CheckCircle } from 'lucide-react';
import type { ActiveKeyItem } from '@/types/dashboard';

interface DashboardKeysSectionProps {
  keys: ActiveKeyItem[];
  loading: boolean;
  onOpenKeysModal: () => void;
}

export const DashboardKeysSection: React.FC<DashboardKeysSectionProps> = ({
  keys,
  loading,
  onOpenKeysModal,
}) => {
  return (
    <div style={{
      background: 'var(--card-bg, #141414)',
      border: '1px solid var(--border, #262626)',
      borderRadius: '10px',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={16} style={{ color: 'var(--accent, #FFDA62)' }} />
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--heading, #ffffff)',
              margin: 0,
            }}>
              Active Gateway API Keys
            </h2>
            <span style={{
              background: 'rgba(255, 218, 98, 0.1)',
              color: 'var(--accent, #FFDA62)',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
            }}>
              {keys.length} ACTIVE
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #9ca3af)' }}>
            Cryptographic credentials authenticating AI agents to the Runwall proxy
          </span>
        </div>

        <button
          onClick={onOpenKeysModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: '1px solid var(--border, #262626)',
            color: 'var(--heading, #ffffff)',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent, #FFDA62)';
            e.currentTarget.style.color = 'var(--accent, #FFDA62)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border, #262626)';
            e.currentTarget.style.color = 'var(--heading, #ffffff)';
          }}
        >
          <Plus size={13} />
          <span>Manage API Keys</span>
        </button>
      </div>

      {loading ? (
        <div style={{ height: '60px', background: '#0f0f0f', borderRadius: '6px', animation: 'pulse 1.5s infinite ease-in-out' }} />
      ) : keys.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted, #888888)', fontSize: '13px' }}>
          No active API keys found for your account.
        </div>
      ) : (
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
                <th style={{ padding: '8px 12px' }}>Label / Name</th>
                <th style={{ padding: '8px 12px' }}>Masked Prefix</th>
                <th style={{ padding: '8px 12px' }}>Tier Scope</th>
                <th style={{ padding: '8px 12px' }}>Created</th>
                <th style={{ padding: '8px 12px' }}>Last Used</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--heading, #ffffff)', fontWeight: 600 }}>
                    {k.name}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--accent, #FFDA62)' }}>
                    <code>{k.prefix}••••••••••••</code>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--body, #b4b4b4)', textTransform: 'capitalize' }}>
                    {k.tier} ({k.environment})
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted, #9ca3af)', whiteSpace: 'nowrap' }}>
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted, #9ca3af)', whiteSpace: 'nowrap' }}>
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: '#10b981',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      <CheckCircle size={12} />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardKeysSection;
