import React, { useState, useEffect } from 'react';
import {
  Key, X, Plus, Copy, Check, Search, Trash2,
  Shield, Zap, Crown, Clock, ArrowRight, AlertCircle
} from 'lucide-react';

interface DeveloperKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onUpgradeClick: () => void;
}

interface APIKeyItem {
  id: number;
  name: string;
  prefix: string;
  environment: string;
  allowed_ips?: string[];
  is_active: boolean;
  created_at?: string;
  tier?: string;
}

interface UsageData {
  api_key_id: number;
  tier: string;
  used: number;
  limit: number | null;
  remaining: number;
  is_exceeded: boolean;
  reset_at: string;
}

export default function DeveloperKeysModal({
  isOpen,
  onClose,
  userEmail,
  onUpgradeClick,
}: DeveloperKeysModalProps) {
  const [apiKeys, setApiKeys] = useState<APIKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keyGenError, setKeyGenError] = useState<{ text: string; status: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (isOpen && userEmail) {
      fetchKeysAndUsage();
    }
  }, [isOpen, userEmail]);

  const fetchKeysAndUsage = async () => {
    setLoading(true);
    try {
      const headers = { 'X-User-Email': userEmail };
      const res = await fetch(`${API_BASE}/dashboard/identity/keys`, { headers });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data);

        // Fetch usage for primary key if available
        if (data.length > 0) {
          try {
            const uRes = await fetch(`${API_BASE}/subscription/usage?api_key_id=${data[0].id}`);
            if (uRes.ok) {
              const uData = await uRes.json();
              setUsage(uData);
            }
          } catch (err) {
            console.error('Failed to load usage data', err);
          }
        }
      }
    } catch (err) {
      showToast('Failed to load API keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setGenerating(true);
    setKeyGenError(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
      };

      const res = await fetch(`${API_BASE}/dashboard/identity/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newKeyName.trim(),
          tier: 'free',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedKey(data.api_key);
        setNewKeyName('');
        showToast('API Key generated successfully!');
        fetchKeysAndUsage();
      } else {
        setKeyGenError({
          text: data.detail || 'Failed to generate key.',
          status: res.status,
        });
        showToast('Key generation failed', 'error');
      }
    } catch (err) {
      setKeyGenError({ text: 'Network error generating API key.', status: 500 });
      showToast('Network error generating key', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    if (!window.confirm('Are you sure you want to revoke this API key? This action is permanent.')) {
      return;
    }

    setRevokingId(keyId);
    try {
      const headers = { 'X-User-Email': userEmail };
      const res = await fetch(`${API_BASE}/dashboard/identity/keys/${keyId}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        showToast('Key revoked successfully');
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        showToast('Failed to revoke key', 'error');
      }
    } catch (err) {
      showToast('Network error revoking key', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
    showToast('Copied to clipboard!');
  };

  if (!isOpen) return null;

  const filteredKeys = apiKeys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.prefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const usagePercent =
    usage && usage.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          setGeneratedKey(null);
        }
      }}
    >
      {/* Outer Card with Signature Yellow Border matching Pricing Section */}
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          background: '#08080a',
          border: '1px solid var(--accent, #FFDA62)',
          borderRadius: 12,
          boxShadow: '0 0 50px rgba(255, 218, 98, 0.08), 0 30px 60px rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid #161616',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #0c0c0f 0%, #08080a 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Key size={18} color="var(--accent)" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 400,
                  color: '#ffffff',
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.02em',
                }}
              >
                Developer API Keys
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#888888',
                  margin: '2px 0 0 0',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Manage gateway credentials and monitor agent execution quotas
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Pricing-style POPULAR / ACTIVE badge */}
            <div
              style={{
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}
            >
              {usage?.tier === 'pro' ? 'PRO ACCESS' : 'DEVELOPER ACCESS'}
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                onClose();
                setGeneratedKey(null);
              }}
              style={{
                background: '#040405',
                border: '1px solid #1c1c1c',
                borderRadius: '8px',
                color: '#888888',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#888888';
                e.currentTarget.style.borderColor = '#1c1c1c';
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Balanced Cards */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 380px) 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
          className="modal-columns"
        >
          {/* LEFT COLUMN: Generation & Plan Quota Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Plan Quota Card */}
            <div
              style={{
                background: '#0a0a0d',
                border: '1px solid #1c1c1c',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={15} color="var(--accent)" />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#ffffff',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    Usage & Limits
                  </span>
                </div>
                <span
                  style={{
                    background: usage?.tier === 'pro' ? 'var(--accent-dim)' : '#121215',
                    color: usage?.tier === 'pro' ? 'var(--accent)' : '#aaaaaa',
                    border: usage?.tier === 'pro' ? '1px solid var(--accent-border)' : '1px solid #222222',
                    borderRadius: '20px',
                    padding: '2px 10px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }}
                >
                  {usage?.tier || 'Free'} Tier
                </span>
              </div>

              {/* Progress Bar & Counter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                    {usage
                      ? `${usage.used.toLocaleString()} / ${usage.limit?.toLocaleString() ?? '15'} requests`
                      : '0 / 15 requests'}
                  </span>
                  <span style={{ fontSize: '12px', color: '#888888' }}>
                    {usage ? `${usage.remaining.toLocaleString()} left` : '15 left'}
                  </span>
                </div>

                <div
                  style={{
                    height: '6px',
                    background: '#161618',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${usagePercent}%`,
                      background:
                        usage?.is_exceeded
                          ? 'var(--destructive, #ef4444)'
                          : usagePercent > 80
                          ? 'var(--warning, #f59e0b)'
                          : 'var(--accent)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Reset date info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#777777',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Clock size={12} />
                <span>
                  {usage?.reset_at
                    ? `Resets on ${new Date(usage.reset_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Resets weekly'}
                </span>
              </div>

              {/* Upgrade CTA Button */}
              {(!usage || usage.tier === 'free') && (
                <button
                  onClick={onUpgradeClick}
                  style={{
                    width: '100%',
                    padding: '11px 0',
                    background: 'var(--accent)',
                    color: '#000000',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    fontFamily: 'var(--font-display)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    marginTop: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <Crown size={14} />
                  <span>Upgrade to Pro — ₹674 / mo</span>
                </button>
              )}
            </div>

            {/* Key Generation Card */}
            <div
              style={{
                background: '#0a0a0d',
                border: '1px solid #1c1c1c',
                borderRadius: '10px',
                padding: '20px',
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#ffffff',
                  margin: '0 0 14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Plus size={14} color="var(--accent)" />
                Create New API Key
              </h3>

              <form onSubmit={handleGenerateKey} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label
                    htmlFor="keyName"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#888888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontFamily: 'var(--font-mono)',
                      marginBottom: '6px',
                    }}
                  >
                    Key Label Name
                  </label>
                  <input
                    id="keyName"
                    type="text"
                    placeholder="e.g. Claude Desktop Agent"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: '#030304',
                      border: '1px solid #1c1c1c',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--accent)';
                      e.target.style.boxShadow = '0 0 10px rgba(255,218,98,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#1c1c1c';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={generating || !newKeyName.trim()}
                  style={{
                    width: '100%',
                    padding: '11px 0',
                    background: 'var(--accent)',
                    color: '#000000',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '13px',
                    fontFamily: 'var(--font-display)',
                    cursor: generating || !newKeyName.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: generating || !newKeyName.trim() ? 0.6 : 1,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!generating && newKeyName.trim()) e.currentTarget.style.opacity = '0.92';
                  }}
                  onMouseLeave={(e) => {
                    if (!generating && newKeyName.trim()) e.currentTarget.style.opacity = '1';
                  }}
                >
                  <span>{generating ? 'Generating Secret...' : 'Generate API Key'}</span>
                  {!generating && <ArrowRight size={14} />}
                </button>
              </form>

              {/* Error Box */}
              {keyGenError && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '10px 12px',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{keyGenError.text}</span>
                </div>
              )}

              {/* Success Generated Key Box */}
              {generatedKey && (
                <div
                  style={{
                    marginTop: '16px',
                    background: '#060a08',
                    border: '1px solid #10b981',
                    borderRadius: '10px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#10b981',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      ✓ Key Generated
                    </span>
                    <button
                      onClick={() => copyToClipboard(generatedKey, 'gen')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {copiedKey === 'gen' ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey === 'gen' ? 'Copied' : 'Copy Key'}
                    </button>
                  </div>

                  <div
                    style={{
                      background: '#020403',
                      border: '1px solid #064e3b',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                      color: '#6ee7b7',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {generatedKey}
                  </div>

                  {/* Claude Desktop URL snippet */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      background: '#0a0a0c',
                      border: '1px solid #1c1c1c',
                      borderRadius: '6px',
                      fontSize: '10px',
                      color: '#888888',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                      https://mcp.runwall.in/mcp?token={generatedKey.slice(0, 16)}...
                    </span>
                    <button
                      onClick={() => {
                        copyToClipboard(`https://mcp.runwall.in/mcp?token=${generatedKey}`);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      {copiedUrl ? <Check size={10} /> : <Copy size={10} />}
                      {copiedUrl ? 'Copied' : 'Copy URL'}
                    </button>
                  </div>

                  <p style={{ fontSize: '10px', color: '#eab308', margin: 0, lineHeight: 1.4 }}>
                    ⚠ Copy this key now. It is hashed with SHA-256 and will not be displayed again.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Keys List Card */}
          <div
            style={{
              background: '#0a0a0d',
              border: '1px solid #1c1c1c',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '440px',
            }}
          >
            {/* Header with Search and Key Count */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} color="var(--accent)" />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#ffffff',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Active Keys
                </span>
                <span
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: '20px',
                    padding: '1px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {apiKeys.length}
                </span>
              </div>

              {/* Search Bar */}
              {apiKeys.length > 3 && (
                <div style={{ position: 'relative', width: '180px' }}>
                  <Search
                    size={13}
                    style={{
                      position: 'absolute',
                      left: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#666666',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search keys..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#040405',
                      border: '1px solid #1c1c1c',
                      borderRadius: '6px',
                      padding: '5px 8px 5px 26px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontFamily: 'var(--font-body)',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={(e) => (e.target.style.borderColor = '#1c1c1c')}
                  />
                </div>
              )}
            </div>

            {/* Keys Scrollable Container */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: '440px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingRight: '4px',
              }}
            >
              {loading && apiKeys.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#888888',
                    fontSize: '13px',
                    padding: '40px 0',
                  }}
                >
                  Loading credentials...
                </div>
              ) : filteredKeys.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    textAlign: 'center',
                    border: '1px dashed #1c1c1c',
                    borderRadius: '10px',
                    background: '#060608',
                  }}
                >
                  <Key size={24} style={{ color: '#444444', marginBottom: '10px' }} />
                  <p style={{ fontSize: '13px', color: '#aaaaaa', margin: '0 0 4px 0' }}>
                    {searchQuery ? 'No keys matching your search' : 'No API keys generated yet'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#666666', margin: 0 }}>
                    Use the form on the left to create your first agent credential.
                  </p>
                </div>
              ) : (
                filteredKeys.map((key) => (
                  <div
                    key={key.id}
                    style={{
                      background: '#040405',
                      border: '1px solid #18181b',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#2c2c2c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#18181b';
                    }}
                  >
                    {/* Top Row: Name + Badges + Revoke */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#ffffff',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {key.name}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '9px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          <span
                            style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              background: '#10b981',
                            }}
                          />
                          ACTIVE
                        </span>
                      </div>

                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        disabled={revokingId === key.id}
                        title="Revoke this API Key"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#666666',
                          cursor: revokingId === key.id ? 'not-allowed' : 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Middle Row: Prefix Chip + Details */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#777777',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Prefix:</span>
                        <span
                          style={{
                            background: '#0c0c0f',
                            border: '1px solid #1c1c1c',
                            borderRadius: '4px',
                            padding: '2px 6px',
                            color: '#dddddd',
                          }}
                        >
                          {key.prefix.startsWith('mcp_') ? key.prefix : `mcp_${key.prefix}`}...
                        </span>
                      </div>

                      <span style={{ fontSize: '10px', color: '#555555' }}>
                        Env: <span style={{ color: '#888888' }}>{key.environment || 'production'}</span>
                      </span>
                    </div>

                    {/* Bottom Row: Connect snippet / info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #111114',
                        paddingTop: '8px',
                        fontSize: '10px',
                        color: '#666666',
                      }}
                    >
                      <span>
                        Created:{' '}
                        {key.created_at
                          ? new Date(key.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Active'}
                      </span>

                      {/* Pricing outline style CTA */}
                      <button
                        onClick={() => copyToClipboard(`https://mcp.runwall.in/mcp`, `mcp-${key.id}`)}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--accent)',
                          borderRadius: '6px',
                          color: 'var(--accent)',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontFamily: 'var(--font-display)',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--accent-dim)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {copiedKey === `mcp-${key.id}` ? <Check size={10} /> : <Copy size={10} />}
                        <span>{copiedKey === `mcp-${key.id}` ? 'Copied' : 'Copy Endpoint'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '28px',
              background: toast.type === 'success' ? 'var(--accent)' : '#ef4444',
              color: '#000000',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 100,
            }}
          >
            {toast.message}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .modal-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
