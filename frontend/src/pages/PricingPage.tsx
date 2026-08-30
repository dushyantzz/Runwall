import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Check, Zap, Crown, Infinity, Copy,
  CheckCircle, Mail, Phone, ExternalLink, X, ChevronDown, ChevronUp 
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../hooks/AuthContext';

const LinkedinIcon = ({ size = 18, color = "#FFDA62" }: { size?: number, color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// ── FAQ Accordion Item Component ──
const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      padding: '20px 0',
      transition: 'all 0.3s ease'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          color: '#ffffff',
          fontSize: 16,
          fontWeight: 600,
          textAlign: 'left',
          cursor: 'pointer',
          padding: 0,
          fontFamily: 'var(--font-display)',
          gap: 16
        }}
      >
        <span>{question}</span>
        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {isOpen && (
        <div style={{
          marginTop: 12,
          color: '#888888',
          fontSize: 14,
          lineHeight: 1.6,
          fontFamily: 'var(--font-body)',
          animation: 'fade-slide 0.25s ease-out'
        }}>
          {answer}
        </div>
      )}
    </div>
  );
};

export default function PricingPage() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const pricingHelmet = (
    <Helmet>
      <title>Pricing — Runwall AI Agent Governance</title>
      <meta name="description" content="Runwall pricing plans for AI agent governance. Start free with the developer plan or upgrade to Pro for advanced policy enforcement, risk scoring, taint tracking, and audit trails." />
      <link rel="canonical" href="https://runwall.vercel.app/pricing" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://runwall.vercel.app/pricing" />
      <meta property="og:title" content="Pricing — Runwall AI Agent Governance" />
      <meta property="og:description" content="Runwall pricing plans for AI agent governance. Start free with the developer plan or upgrade to Pro for advanced policy enforcement, risk scoring, taint tracking, and audit trails." />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Pricing — Runwall AI Agent Governance" />
      <meta name="twitter:description" content="Start free or go Pro. Runwall provides agent-native execution governance with policy enforcement, risk scoring, and audit trails for AI agents on MCP servers." />
    </Helmet>
  );

  const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const API_BASE = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

  const handleCta = async (action: string) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setErrorMsg(null);
    if (action === 'free') {
      setLoading(true);
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (user.email) {
          headers['X-User-Email'] = user.email;
        }
        const res = await fetch(`${API_BASE}/dashboard/identity/keys`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: 'Free API Key',
            tier: 'free',
          })
        });
        const data = await res.json();
        if (res.ok) {
          setGeneratedKey(data.api_key);
        } else {
          setErrorMsg(data.detail || 'Failed to generate Free key. You may have exhausted your limits.');
        }
      } catch (err) {
        setErrorMsg('Network error creating Free key.');
      } finally {
        setLoading(false);
      }
    } else if (action === 'upgrade') {
      setModalOpen(true);
    } else if (action === 'enterprise') {
      setEnterpriseModalOpen(true);
    }
  };

  const copyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Pricing Tiers Definition (Developer API Keys)
  const devTiers = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: '/month',
      tagline: 'Ideal for testing & sandbox development.',
      icon: <Zap size={18} />,
      color: '#777777',
      highlight: false,
      features: [
        '15 requests per week',
        '60 requests per minute limit',
        'Full Runwall security layer',
        'Basic OPA policy verification',
        'Audit logs (24h retention)',
        'Community forum support'
      ],
      cta: 'Start for Free',
      ctaAction: 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$7',
      period: '/month',
      tagline: 'For production-grade agent security governance.',
      icon: <Crown size={18} />,
      color: 'var(--accent)',
      badge: 'POPULAR',
      highlight: true,
      features: [
        '2,000 requests per month',
        'Custom OPA policy generation',
        'Advanced JWT client validation',
        'Instant credit renewals',
        'Email priority support',
        'Audit logs (30-day retention)'
      ],
      cta: 'Upgrade to Pro',
      ctaAction: 'upgrade'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      tagline: 'Tailored compliance for corporate networks.',
      icon: <Infinity size={18} />,
      color: '#a855f7',
      highlight: false,
      features: [
        'Unlimited rate limits & connections',
        'Dedicated SLA guarantees',
        'Custom Rego rules development',
        'On-premise broker gateway setup',
        'Dedicated support engineer',
        'Custom invoicing & billing contracts'
      ],
      cta: 'Contact Sales',
      ctaAction: 'enterprise'
    }
  ];

  const faqs = [
    {
      category: 'Billing',
      question: 'How do payments work on Runwall?',
      answer: 'For the Pro plan, we use Razorpay to process subscriptions in INR/USD. You can securely set up recurring billing and cancel anytime in your billing panel. For Enterprise plans, we offer custom invoicing.'
    },
    {
      category: 'Billing',
      question: 'Can I downgrade or cancel my subscription?',
      answer: 'Yes! You can cancel your subscription at any time. When you cancel, your access continues until the end of your billing period, after which your account reverts to the Free tier.'
    },
    {
      category: 'Security',
      question: 'How does OPA policy enforcement work?',
      answer: 'Runwall uses Open Policy Agent (OPA) internally. When an agent requests to connect to a tool (e.g. GitHub or a Database), Runwall evaluates the tool call parameters against your configured OPA rules and dynamically permits, intercepts, or audits the action.'
    },
    {
      category: 'Security',
      question: 'What is the MCP Gateway broker?',
      answer: 'The Model Context Protocol (MCP) gateway acts as a proxy between your LLM agent (like Claude Desktop) and external APIs. Runwall provides a secure endpoint to verify agent tokens and policy bounds on every single call.'
    },
    {
      category: 'Enterprise',
      question: 'Do you support on-premise deployments?',
      answer: 'Yes, we do. For our Enterprise customers, we support deploying the Runwall Gateway on your private cloud (AWS, GCP, Azure) or local network infrastructure via containerized deployments.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', fontFamily: 'var(--font-body)', padding: '0 0 100px' }}>
      {pricingHelmet}
      {/* Hero Header Section */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '120px 24px 48px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '3.75rem',
          fontWeight: 300,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          color: '#ffffff',
          marginBottom: 20
        }}>
          Our pricing
        </h1>
        <p style={{
          fontSize: 14,
          color: '#b4b4b4',
          maxWidth: 620,
          lineHeight: 1.6,
          marginBottom: 8
        }}>
          Select the optimal plan to audit, govern, and secure your autonomous AI agent integrations.
        </p>

        {errorMsg && (
          <div style={{
            maxWidth: 500, margin: '24px 0 0', padding: '14px 18px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, color: 'var(--destructive)', fontSize: 13, fontWeight: 500
          }}>
            {errorMsg}
          </div>
        )}

        {loading && (
          <div style={{ color: 'var(--accent)', fontSize: 14, marginTop: 24, fontWeight: 600 }}>
            Generating your credential, please wait...
          </div>
        )}
      </div>

      {/* Main Pricing Grid */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32
      }}>
        {devTiers.map((tier) => (
          <div
            key={tier.id}
            style={{
              background: '#08080a',
              border: tier.highlight ? '1px solid var(--accent)' : '1px solid #1c1c1c',
              borderRadius: 12,
              padding: '36px 30px',
              boxShadow: tier.highlight ? '0 0 40px rgba(255,218,98,0.05)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="pricing-card"
          >
            {/* Highlighted Badge */}
            {tier.badge && (
              <div style={{
                position: 'absolute',
                top: 20,
                right: 24,
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent-border)',
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 10,
                fontWeight: 700,
                color: 'var(--accent)',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)'
              }}>
                {tier.badge}
              </div>
            )}

            {/* Plan Info */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 400, color: '#ffffff', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
                {tier.name}
              </div>
              <div style={{ fontSize: 13, color: '#888888', minHeight: 40, lineHeight: 1.5 }}>
                {tier.tagline}
              </div>
            </div>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 32 }}>
              <span style={{ fontSize: 44, fontWeight: 300, color: '#ffffff', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>{tier.price}</span>
              {tier.period && <span style={{ fontSize: 14, color: '#666666', fontFamily: 'var(--font-mono)' }}>{tier.period}</span>}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => handleCta(tier.ctaAction)}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 8,
                border: tier.highlight ? 'none' : '1px solid var(--accent)',
                background: tier.highlight ? 'var(--accent)' : 'transparent',
                color: tier.highlight ? '#000000' : 'var(--accent)',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer',
                marginBottom: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: tier.highlight ? '0 0 20px rgba(255, 218, 98, 0.15)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (tier.highlight) {
                  e.currentTarget.style.opacity = '0.9';
                } else {
                  e.currentTarget.style.background = 'var(--accent-dim)';
                }
              }}
              onMouseLeave={(e) => {
                if (tier.highlight) {
                  e.currentTarget.style.opacity = '1';
                } else {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{tier.cta}</span>
              <span style={{ fontSize: 14 }}>&rarr;</span>
            </button>

            {/* Features List Header */}
            <div style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              marginBottom: 16,
              fontWeight: 600
            }}>
              Key Features Include:
            </div>

            {/* Feature Checkmarks */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tier.features.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#dddddd', lineHeight: 1.4 }}>
                  <Check size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Symmetrical FAQ Section */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div className="pricing-faq-grid" style={{
          borderTop: '1px solid #161616',
          paddingTop: 60,
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: 32
        }}>
          {/* FAQ Left Column */}
          <div className="pricing-faq-left" style={{ gridColumn: 'span 4' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 300,
              color: '#ffffff',
              marginBottom: 12,
              letterSpacing: '-0.02em'
            }}>
              Frequently asked questions
            </h2>
            <p style={{ fontSize: 14, color: '#b4b4b4', lineHeight: 1.5 }}>
              Have questions about billing, security, or MCP configurations? Contact our team at{' '}
              <a href="mailto:dushyantkv508@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>dushyantkv508@gmail.com</a>.
            </p>
          </div>

          {/* FAQ Right Column (Accordion List) */}
          <div className="pricing-faq-right" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column' }}>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .pricing-faq-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            .pricing-faq-left,
            .pricing-faq-right {
              grid-column: span 12 !important;
            }
            .pricing-faq-left {
              margin-bottom: 12px;
            }
          }
        `}</style>
      </div>

      {/* Bottom Callout Banner */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          background: 'radial-gradient(circle at top right, #111111 0%, #060606 100%)',
          border: '1px solid #1a1a1a',
          borderRadius: 12,
          padding: '60px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 32
        }}>
          <div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 300,
              color: '#ffffff',
              marginBottom: 10,
              letterSpacing: '-0.02em'
            }}>
              Get started for free
            </h2>
            <p style={{ fontSize: 14, color: '#b4b4b4', maxWidth: 480, lineHeight: 1.6 }}>
              Join hundreds of developers securing their autonomous model context protocol integrations today.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={() => handleCta('free')}
              style={{
                background: 'var(--accent)',
                color: '#000000',
                border: 'none',
                borderRadius: 8,
                padding: '14px 28px',
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 4px 20px rgba(255, 218, 98, 0.2)'
              }}
            >
              Start Free Trial
            </button>
            <button
              onClick={() => setEnterpriseModalOpen(true)}
              style={{
                background: 'transparent',
                color: '#ffffff',
                border: '1px solid #262626',
                borderRadius: 8,
                padding: '14px 28px',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#262626'}
            >
              Talk to Sales
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modals & Key Dialogs */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userEmail={user?.email || undefined}
        userName={user?.email?.split('@')[0] || undefined}
        onSuccess={(apiKey) => {
          setModalOpen(false);
          if (apiKey) {
            setGeneratedKey(apiKey);
          } else {
            window.location.href = '/';
          }
        }}
      />

      {generatedKey && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#0a0a0a', border: '1px solid #1c1c1c', borderRadius: 16,
            padding: 32, maxWidth: 500, width: '100%', textAlign: 'center',
            boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px', color: '#10b981'
            }}>
              <CheckCircle size={28} />
            </div>
            
            <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 8px 0' }}>
              Your API Key is Ready!
            </h3>
            <p style={{ fontSize: 13, color: '#777', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Copy this token now. For security reasons, you will not be able to see it again.
            </p>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, background: '#000',
              border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 16px',
              marginBottom: 24
            }}>
              <code style={{
                color: 'var(--accent)', fontSize: 13, wordBreak: 'break-all',
                flexGrow: 1, textAlign: 'left', fontFamily: 'monospace'
              }}>
                {generatedKey}
              </code>
              <button
                onClick={copyToClipboard}
                style={{
                  background: 'none', border: 'none', color: copied ? '#10b981' : '#777',
                  cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Claude Custom Connector URL Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              background: '#0e0e11',
              border: '1px solid #222',
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: '#888'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px', textAlign: 'left' }}>
                https://mcp.runwall.in/mcp?token={generatedKey.slice(0, 16)}...
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://mcp.runwall.in/mcp?token=${generatedKey}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>Copy Connector URL</span>
              </button>
            </div>

            <button
              onClick={() => {
                setGeneratedKey(null);
                window.location.href = '/';
              }}
              style={{
                width: '100%', padding: '12px 0', background: 'var(--accent)',
                color: '#000', border: 'none', borderRadius: 8, fontWeight: 700,
                fontSize: 14, cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {enterpriseModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#0a0a0a', border: '1px solid #222222', borderRadius: 16,
            padding: 32, maxWidth: 480, width: '100%', position: 'relative',
            boxShadow: '0 24px 48px rgba(0,0,0,0.8)'
          }}>
            <button
              onClick={() => setEnterpriseModalOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'none',
                border: 'none', color: '#666', cursor: 'pointer', padding: 4
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: 48, height: 48, borderRadius: 12, background: 'rgba(255,218,98,0.1)',
              border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: 16, color: 'var(--accent)'
            }}>
              <Infinity size={24} />
            </div>

            <h3 style={{ color: '#ffffff', fontSize: 20, fontWeight: 700, margin: '0 0 6px 0' }}>
              Enterprise Custom Setup
            </h3>
            <p style={{ fontSize: 13, color: '#888888', margin: '0 0 24px 0', lineHeight: 1.5 }}>
              Contact our founding engineering team directly for custom OPA policies, dedicated SLA guarantees, and on-premise execution.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <a
                href="mailto:dushyantkv508@gmail.com?subject=Runwall%20Enterprise%20Inquiry"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: '#111111', border: '1px solid #222222', borderRadius: 10,
                  textDecoration: 'none', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222222'}
              >
                <Mail size={18} color="var(--accent)" />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: 11, color: '#666666', fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>dushyantkv508@gmail.com</div>
                </div>
                <ExternalLink size={14} color="#666" />
              </a>

              <a
                href="tel:+919451856439"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: '#111111', border: '1px solid #222222', borderRadius: 10,
                  textDecoration: 'none', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222222'}
              >
                <Phone size={18} color="var(--accent)" />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: 11, color: '#666666', fontWeight: 600, textTransform: 'uppercase' }}>Phone / WhatsApp</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>+91 9451856439</div>
                </div>
                <ExternalLink size={14} color="#666" />
              </a>

              <a
                href="https://www.linkedin.com/company/runwall"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  background: '#111111', border: '1px solid #222222', borderRadius: 10,
                  textDecoration: 'none', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#222222'}
              >
                <LinkedinIcon size={18} color="var(--accent)" />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: 11, color: '#666666', fontWeight: 600, textTransform: 'uppercase' }}>LinkedIn Company Page</div>
                  <div style={{ fontSize: 13, color: '#ffffff', fontWeight: 500 }}>linkedin.com/company/runwall</div>
                </div>
                <ExternalLink size={14} color="#666" />
              </a>
            </div>

            <button
              onClick={() => setEnterpriseModalOpen(false)}
              style={{
                marginTop: 20, width: '100%', padding: '10px 0', background: '#1a1a1a',
                color: '#aaa', border: '1px solid #262626', borderRadius: 8, fontWeight: 600,
                fontSize: 13, cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
