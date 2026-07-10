import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Key, Fingerprint, Plus, Copy } from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // API Key modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeySvcAcct, setNewKeySvcAcct] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [serviceAccounts, setServiceAccounts] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

  const notify = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    if (modalOpen && user) {
      fetchModalData();
    }
  }, [modalOpen, user]);

  const fetchModalData = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (user?.email) {
        headers['X-User-Email'] = user.email;
      }
      const [saRes, kRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/identity/service-accounts`, { headers }),
        fetch(`${API_BASE}/dashboard/identity/keys`, { headers })
      ]);
      if (saRes.ok) setServiceAccounts(await saRes.json());
      if (kRes.ok) setApiKeys(await kRes.json());
    } catch (err) {
      notify('error', 'Failed to fetch identity data.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !newKeySvcAcct) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user?.email) {
        headers['X-User-Email'] = user.email;
      }
      const res = await fetch(`${API_BASE}/dashboard/identity/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newKeyName,
          service_account_id: parseInt(newKeySvcAcct)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedKey(data.api_key);
        notify('success', 'API Key generated successfully.');
        setNewKeyName('');
        // Re-fetch keys
        const kRes = await fetch(`${API_BASE}/dashboard/identity/keys`, { headers });
        if (kRes.ok) setApiKeys(await kRes.json());
      } else {
        notify('error', data.detail || 'Failed to generate API key.');
      }
    } catch (err) {
      notify('error', 'Network error generating API key.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify('success', 'Copied to clipboard!');
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(0,0,0,0.85)' : '#000000',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid #333333',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img
            src="/logo.svg"
            alt="Runwall Logo"
            style={{
              height: '28px',
              width: 'auto',
              display: 'block'
            }}
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--heading)',
            letterSpacing: '-0.02em',
          }}>
            Runwall
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="desktop-nav">
          <NavLink to="/docs">Documentation</NavLink>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-nav">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {user.email}
              </span>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  background: 'rgba(0, 180, 216, 0.1)',
                  border: '1px solid rgba(0, 180, 216, 0.3)',
                  borderRadius: '6px',
                  color: '#00b4d8',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 180, 216, 0.2)';
                  e.currentTarget.style.borderColor = '#00b4d8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 180, 216, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.3)';
                }}
              >
                <Key size={13} />
                API Keys
              </button>
              <button
                onClick={signOut}
                style={{
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--body)',
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--heading)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--body)';
                }}
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" style={{
                color: '#b4b4b4',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                transition: 'color 0.2s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#b4b4b4')}
              >
                Login
              </Link>

              <Link to="/signup" style={{
                background: 'var(--accent)',
                color: '#000000',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: '6px',
                transition: 'opacity 0.2s',
              }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--heading)',
            cursor: 'pointer',
            padding: 8,
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="mobile-menu"
          style={{
            background: '#000000',
            borderTop: '1px solid #333333',
            padding: '16px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <Link to="/docs" style={{ padding: '8px 10px', color: '#b4b4b4', textDecoration: 'none', fontSize: 13 }}>Documentation</Link>
          <div style={{ borderTop: '1px solid #333333', margin: '8px 0' }} />
          {user ? (
            <>
              <button
                onClick={() => {
                  setModalOpen(true);
                  setMobileOpen(false);
                }}
                style={{
                  width: '100%',
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 10px',
                  background: 'rgba(0, 180, 216, 0.1)',
                  border: '1px solid rgba(0, 180, 216, 0.3)',
                  borderRadius: '6px',
                  color: '#00b4d8',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Key size={14} />
                API Keys
              </button>
              <button 
                onClick={signOut} 
                className="btn btn-secondary" 
                style={{ 
                  width: '100%', 
                  marginTop: 8, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 6,
                  padding: '8px 10px',
                  background: 'none',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--heading)',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Sign Up</Link>
          )}
        </div>
      )}

      {/* API Key Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '90%',
            maxWidth: '800px',
            background: '#050505',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setModalOpen(false);
                setGeneratedKey(null);
              }}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#888',
                cursor: 'pointer',
                padding: 4
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
            >
              <X size={18} />
            </button>

            {/* Title */}
            <h3 style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '18px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={18} color="var(--accent)" /> Developer API Keys
            </h3>
            <p style={{ fontSize: '12px', color: '#666666', margin: '0 0 24px 0' }}>
              Create and manage secure API keys linked to service accounts to connect external agents.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Form block */}
              <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '16px', background: '#000000' }}>
                <h4 style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 16px 0' }}>
                  <Plus size={14} color="var(--accent)" /> Generate Enterprise API Key
                </h4>
                <form onSubmit={handleGenerateKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Key Label Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. SalesSyncAgentKey" 
                      value={newKeyName} 
                      onChange={e => setNewKeyName(e.target.value)}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#777777', marginBottom: 4 }}>Target Service Account</label>
                    <select 
                      value={newKeySvcAcct} 
                      onChange={e => setNewKeySvcAcct(e.target.value)}
                      style={{ width: '100%', background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 4, padding: '8px 12px', fontSize: 13, color: '#ffffff' }}
                      required
                    >
                      <option value="">-- Select Account --</option>
                      {serviceAccounts.map(sa => (
                        <option key={sa.id} value={sa.id}>{sa.name} (Tenant: {sa.tenant_id})</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px 0', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} disabled={loading}>
                    Generate Token
                  </button>
                </form>

                {generatedKey && (
                  <div style={{ marginTop: 16, border: '1px dashed #10b981', borderRadius: 6, padding: 12, background: 'rgba(16,185,129,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: '#10b981', fontWeight: 600, textTransform: 'uppercase' }}>Secret API Key Generated</span>
                      <button 
                        onClick={() => copyToClipboard(generatedKey)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Copy size={10} /> Copy
                      </button>
                    </div>
                    <code style={{ fontSize: 11, wordBreak: 'break-all', color: '#ffffff', fontFamily: 'monospace' }}>{generatedKey}</code>
                    <p style={{ fontSize: 9, color: '#ff9f1c', margin: '6px 0 0 0' }}>Make sure to copy this token now. It will not be shown again.</p>
                  </div>
                )}
              </div>

              {/* API Keys list */}
              <div style={{ border: '1px solid #1a1a1a', borderRadius: '8px', padding: '16px', background: '#000000', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ color: '#ffffff', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 16px 0' }}>
                  <Fingerprint size={14} color="var(--accent)" /> Active API Keys
                </h4>
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: 240 }}>
                  {loading && apiKeys.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 20 }}>Loading API keys...</div>
                  ) : apiKeys.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#777777', textAlign: 'center', padding: 20 }}>No API Keys generated yet.</div>
                  ) : (
                    apiKeys.map(k => (
                      <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111111' }}>
                        <div>
                          <div style={{ fontSize: 12, color: '#ffffff', fontWeight: 500 }}>{k.name}</div>
                          <div style={{ fontSize: 10, color: '#555555' }}>Prefix: <code>{k.prefix}</code> • Env: {k.environment}</div>
                        </div>
                        <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>ACTIVE</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Notification alert inside Modal */}
            {notification && (
              <div style={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                background: notification.type === 'success' ? '#10b981' : '#ef4444',
                color: '#000000',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {notification.text}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        color: 'var(--muted)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        padding: '6px 10px',
        textDecoration: 'none',
        transition: 'color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
    >
      {children}
    </Link>
  );
}
