import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown, Menu, X,
  Fingerprint, Building2, Puzzle, FileCode2,
  Radio, BarChart3, Route, GitBranch,
  ClipboardList, RotateCcw, Gauge, Box
} from 'lucide-react';

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
        borderBottom: scrolled ? '1px solid #141414' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            background: 'var(--accent)',
            width: 14,
            height: 14,
            transform: 'rotate(45deg)',
            borderRadius: '2px',
            position: 'relative'
          }}>
            <div style={{
              background: '#000',
              width: 6,
              height: 6,
              position: 'absolute',
              top: 4,
              left: 4
            }} />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--heading)',
            letterSpacing: '-0.02em',
          }}>
            AegisGuard
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
                fontSize: 12,
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

          <NavLink to="/blog">Blogs</NavLink>
          <NavLink to="/docs">Docs</NavLink>
          <NavLink to="/integrations">Integrations</NavLink>
          <NavLink to="/templates">Templates</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/careers">Careers</NavLink>
          <NavLink to="/roadmap">Roadmap</NavLink>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="desktop-nav">
          {/* Discord Icon */}
          <a
            href="https://discord.gg"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#b4b4b4', opacity: 0.8 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
          >
            <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,67.43,67.43,0,0,1-10.5-5c2.06-1.5,4.07-3.14,6-4.87a75.25,75.25,0,0,0,66,0c1.91,1.73,3.92,3.37,6,4.87a67.4,67.4,0,0,1-10.5,5,77.06,77.06,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,48.12,123.6,25.25,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
            </svg>
          </a>

          {/* GitHub Star Badge */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              textDecoration: 'none',
              color: '#b4b4b4',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              border: '1px solid #1c1c1c',
              borderRadius: 4,
              padding: '2px 6px',
              background: '#0d0d0d',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1c1c1c')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>12.0k</span>
          </a>

          <Link to="/login" style={{
            color: '#b4b4b4',
            textDecoration: 'none',
            fontSize: 12,
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
            fontSize: 12,
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
            borderTop: '1px solid #141414',
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
          <div style={{ borderTop: '1px solid #141414', margin: '8px 0' }} />
          <Link to="/blog" style={{ padding: '8px 10px', color: '#b4b4b4', textDecoration: 'none', fontSize: 13 }}>Blogs</Link>
          <Link to="/docs" style={{ padding: '8px 10px', color: '#b4b4b4', textDecoration: 'none', fontSize: 13 }}>Docs</Link>
          <Link to="/pricing" style={{ padding: '8px 10px', color: '#b4b4b4', textDecoration: 'none', fontSize: 13 }}>Pricing</Link>
          <div style={{ borderTop: '1px solid #141414', margin: '8px 0' }} />
          <Link to="/signup" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Sign Up</Link>
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
        fontSize: 12,
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
