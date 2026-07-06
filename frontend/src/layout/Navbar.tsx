import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, Menu, X,
  Fingerprint, Building2, Puzzle, FileCode2,
  Radio, BarChart3, Route, GitBranch,
  ClipboardList, RotateCcw, Gauge, Box, LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/AuthContext';

const featureLinks = [
  { to: '/features/identity-access-control', label: 'Identity & Access Control', icon: Fingerprint },
  { to: '/features/tenant-management', label: 'Tenant & Org Management', icon: Building2 },
  { to: '/features/tool-mcp-registry', label: 'Tool / MCP Registry', icon: Puzzle },
  { to: '/features/policy-engine', label: 'Policy Engine', icon: FileCode2 },
  { to: '/features/runtime-interceptor', label: 'Runtime Interceptor', icon: Radio },
  { to: '/features/risk-scoring-engine', label: 'Risk Scoring Engine', icon: BarChart3 },
  { to: '/features/taint-tracking-engine', label: 'Taint Tracking Engine', icon: Route },
  { to: '/features/approval-workflow-engine', label: 'Approval Workflow Engine', icon: GitBranch },
  { to: '/features/audit-evidence-replay', label: 'Audit / Evidence / Replay', icon: ClipboardList },
  { to: '/features/rollback-compensating', label: 'Rollback / Compensating', icon: RotateCcw },
  { to: '/features/quotas-budgets-rate-limits', label: 'Quotas / Budgets / Limits', icon: Gauge },
  { to: '/features/sandboxing-execution-profiles', label: 'Sandboxing / Exec Profiles', icon: Box },
];

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setFeaturesOpen(false);
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
          {/* Features dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 500,
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
            >
              Products <ChevronDown size={12} style={{ opacity: 0.6 }} />
            </button>

            {/* Dropdown */}
            {featuresOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#000000',
                border: '1px solid #1c1c1c',
                borderRadius: 8,
                padding: 6,
                width: 500,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                animation: 'fadeIn 0.12s ease-out',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
              }}>
                {featureLinks.map((f) => (
                  <Link
                    key={f.to}
                    to={f.to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      borderRadius: 4,
                      textDecoration: 'none',
                      color: '#b4b4b4',
                      fontSize: 12,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#111';
                      e.currentTarget.style.color = 'var(--heading)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#b4b4b4';
                    }}
                  >
                    <f.icon size={13} color="var(--accent)" />
                    {f.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

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
          <div style={{ padding: '8px 0', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Features
          </div>
          {featureLinks.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 4,
                textDecoration: 'none', color: '#b4b4b4', fontSize: 13,
              }}
            >
              <f.icon size={14} color="var(--accent)" />
              {f.label}
            </Link>
          ))}
          <Link to="/docs" style={{ padding: '8px 10px', color: '#b4b4b4', textDecoration: 'none', fontSize: 13 }}>Documentation</Link>
          <div style={{ borderTop: '1px solid #333333', margin: '8px 0' }} />
          {user ? (
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
          ) : (
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Sign Up</Link>
          )}
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
