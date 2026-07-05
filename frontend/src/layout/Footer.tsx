import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', to: '/#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Changelog', to: '/changelog' },
    { label: 'Roadmap', to: '/roadmap' },
  ],
  Platform: [
    { label: 'Identity & Access', to: '/features/identity-access-control' },
    { label: 'Policy Engine', to: '/features/policy-engine' },
    { label: 'Risk Scoring', to: '/features/risk-scoring-engine' },
    { label: 'Audit & Replay', to: '/features/audit-evidence-replay' },
    { label: 'Approval Workflows', to: '/features/approval-workflow-engine' },
    { label: 'Sandboxing', to: '/features/sandboxing-execution-profiles' },
  ],
  Developers: [
    { label: 'Documentation', to: '/docs' },
    { label: 'API Reference', to: '/docs/api' },
    { label: 'SDKs', to: '/docs/sdks' },
    { label: 'GitHub', to: 'https://github.com', external: true },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
    { label: 'Contact', to: '/contact' },
  ],
  Legal: [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Security', to: '/security' },
  ],
};

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
      <div className="container" style={{ paddingTop: 64, paddingBottom: 40 }}>
        {/* Links Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 32,
          marginBottom: 48,
        }}>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                marginBottom: 16,
                fontWeight: 500,
              }}>
                {category}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    {'external' in link ? (
                      <a
                        href={link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--body)',
                          fontSize: 13,
                          textDecoration: 'none',
                          transition: 'color 0.15s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
                      >
                        {link.label}
                        <ExternalLink size={10} />
                      </a>
                    ) : (
                      <Link
                        to={link.to}
                        style={{
                          color: 'var(--body)',
                          fontSize: 13,
                          textDecoration: 'none',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--heading)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--body)')}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.svg"
              alt="Runwall Logo"
              style={{
                height: '26px',
                width: 'auto',
                display: 'block'
              }}
            />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--heading)',
            }}>
              Runwall
            </span>
            <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {[
              { label: 'GitHub', href: 'https://github.com' },
              { label: 'Twitter', href: 'https://twitter.com' },
              { label: 'LinkedIn', href: 'https://linkedin.com' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-bright)';
                  e.currentTarget.style.background = 'var(--card-hover)';
                  e.currentTarget.style.color = 'var(--heading)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 768px) {
          footer .container > div:first-child {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          footer .container > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
