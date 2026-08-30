import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Key } from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';
import DeveloperKeysModal from '../components/DeveloperKeysModal';
import PaymentModal from '../components/PaymentModal';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
              display: 'block',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--heading)',
              letterSpacing: '-0.02em',
            }}
          >
            Runwall
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} className="desktop-nav">
          <NavLink to="/docs">Documentation</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
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
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: '6px',
                  color: 'var(--accent)',
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
                  e.currentTarget.style.background = 'rgba(255, 218, 98, 0.18)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent-dim)';
                  e.currentTarget.style.borderColor = 'var(--accent-border)';
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
              <Link
                to="/login"
                style={{
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

              <Link
                to="/signup"
                className="btn-trendy-primary"
                style={{
                  padding: '6px 16px',
                  fontSize: 13,
                }}
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
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--heading)',
            cursor: 'pointer',
            padding: 8,
            minWidth: 44,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Full-Screen Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="mobile-menu-overlay">
          {/* Close button at top right */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            style={{
              position: 'absolute',
              top: 16,
              right: 20,
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: 8,
              minWidth: 44,
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
            }}
          >
            <X size={24} />
          </button>

          {/* Nav links */}
          <nav style={{ flex: 1 }}>
            <Link to="/docs" className="mobile-menu-nav-link" onClick={() => setMobileOpen(false)}>
              Documentation
            </Link>
            <Link to="/pricing" className="mobile-menu-nav-link" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
          </nav>

          {/* Action buttons at bottom */}
          <div className="mobile-menu-actions">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setModalOpen(true);
                    setMobileOpen(false);
                  }}
                  className="mobile-menu-btn-primary"
                >
                  <Key size={16} style={{ marginRight: 8 }} />
                  API Keys
                </button>
                <button onClick={signOut} className="mobile-menu-btn-secondary">
                  <LogOut size={16} style={{ marginRight: 8 }} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/signup" className="mobile-menu-btn-primary" onClick={() => setMobileOpen(false)}>
                  Sign Up Free
                </Link>
                <Link to="/login" className="mobile-menu-btn-secondary" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Developer API Keys Modal */}
      {user && (
        <DeveloperKeysModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          userEmail={user.email || ''}
          onUpgradeClick={() => {
            setModalOpen(false);
            setPayModalOpen(true);
          }}
        />
      )}

      {/* Razorpay Upgrade Checkout Modal */}
      {user && (
        <PaymentModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          apiKeyId={1}
          userEmail={user.email || ''}
          userName={user.email?.split('@')[0] || ''}
          onSuccess={() => {
            setPayModalOpen(false);
            notify('success', 'Upgraded to Pro tier successfully!');
          }}
        />
      )}

      {/* Notification alert */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: notification.type === 'success' ? 'var(--accent)' : '#ef4444',
            color: '#000000',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 1100,
          }}
        >
          {notification.text}
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
