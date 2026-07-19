import { useState } from 'react';
import { Check, Zap, Crown, Infinity, ArrowRight, Star, Shield } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';

// ── Tier data ─────────────────────────────────────────────────────────────────

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '/month',
    tagline: 'Get started with Runwall',
    icon: <Zap size={20} />,
    color: '#777777',
    highlight: false,
    features: [
      '15 requests per week',
      '60 requests per minute',
      'Full Runwall security layer',
      'OPA policy enforcement',
      'Audit logs',
      'Community support',
    ],
    cta: 'Start Free',
    ctaAction: 'free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$7',
    period: '/month',
    tagline: 'For serious AI builders',
    icon: <Crown size={20} />,
    color: '#FFDA62',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '2,000 requests per month',
      '500 requests per minute',
      'Full Runwall security layer',
      'OPA policy enforcement',
      'Advanced audit trails',
      'Rate limit dashboard',
      'Auto-renewal',
      'Email support',
    ],
    cta: 'Upgrade to Pro',
    ctaAction: 'upgrade',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'Unlimited scale, custom terms',
    icon: <Infinity size={20} />,
    color: '#3b82f6',
    highlight: false,
    features: [
      'Unlimited requests',
      'Unlimited RPM',
      'Custom rate limits',
      'Dedicated support',
      'SLA guarantees',
      'Custom OPA policies',
      'On-premise option',
      'Contract & invoicing',
    ],
    cta: 'Contact Sales',
    ctaAction: 'enterprise',
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  // TODO: replace with real API key ID from auth context
  const [activeApiKeyId] = useState<number>(1);

  const handleCta = (action: string) => {
    if (action === 'upgrade') setModalOpen(true);
    if (action === 'enterprise') {
      window.open('mailto:sales@runwall.dev?subject=Enterprise%20Inquiry', '_blank');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '0 0 80px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 56px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,218,98,0.08)',
          border: '1px solid rgba(255,218,98,0.2)',
          borderRadius: 20, padding: '5px 14px',
          color: 'var(--accent)', fontSize: 12, fontWeight: 600,
          marginBottom: 20, letterSpacing: '0.04em',
        }}>
          <Star size={11} />
          SIMPLE, TRANSPARENT PRICING
        </div>

        <h1 style={{
          color: 'var(--heading)', fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 3.2rem)',
          fontWeight: 800, lineHeight: 1.15, marginBottom: 16,
        }}>
          Choose your Runwall plan
        </h1>
        <p style={{ color: 'var(--body)', fontSize: 16, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Every plan includes the full Runwall security layer — OPA policies, audit logs, and AI threat detection.
        </p>
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24, maxWidth: 1040, margin: '0 auto', padding: '0 24px',
      }}>
        {tiers.map((tier) => (
          <div
            key={tier.id}
            style={{
              position: 'relative',
              background: tier.highlight ? 'var(--card-hover)' : 'var(--card-bg)',
              border: `1px solid ${tier.highlight ? 'rgba(255,218,98,0.3)' : 'var(--border)'}`,
              borderRadius: 16, padding: 28,
              boxShadow: tier.highlight ? '0 0 40px rgba(255,218,98,0.06)' : 'none',
              display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = tier.highlight
                ? '0 16px 60px rgba(255,218,98,0.1)'
                : '0 16px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = tier.highlight
                ? '0 0 40px rgba(255,218,98,0.06)'
                : 'none';
            }}
          >
            {/* Popular badge */}
            {tier.badge && (
              <div style={{
                position: 'absolute', top: -12, left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--accent)', color: '#000',
                borderRadius: 20, padding: '3px 14px',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {tier.badge}
              </div>
            )}

            {/* Tier header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 8,
                background: `${tier.color}18`,
                border: `1px solid ${tier.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: tier.color,
              }}>
                {tier.icon}
              </div>
              <div>
                <div style={{ color: 'var(--heading)', fontWeight: 700, fontSize: 16 }}>{tier.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: 12 }}>{tier.tagline}</div>
              </div>
            </div>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ color: tier.color, fontWeight: 800, fontSize: 36 }}>{tier.price}</span>
              {tier.period && <span style={{ color: 'var(--muted)', fontSize: 14 }}>{tier.period}</span>}
            </div>

            {/* Features */}
            <ul style={{ listStyle: 'none', flexGrow: 1, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {tier.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <Check size={14} style={{ color: tier.color, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--body)', fontSize: 13, lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              onClick={() => handleCta(tier.ctaAction)}
              style={{
                width: '100%', padding: '11px 0',
                background: tier.highlight ? tier.color : 'transparent',
                color: tier.highlight ? '#000' : tier.color,
                border: `1px solid ${tier.color}`,
                borderRadius: 8,
                fontWeight: 700, fontSize: 14,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                if (!tier.highlight) {
                  (e.currentTarget as HTMLButtonElement).style.background = `${tier.color}15`;
                }
              }}
              onMouseLeave={e => {
                if (!tier.highlight) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }
              }}
            >
              {tier.cta}
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Trust signals */}
      <div style={{
        maxWidth: 700, margin: '64px auto 0', padding: '0 24px',
        display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {[
          { icon: <Shield size={14} />, text: 'PCI-DSS compliant via Razorpay' },
          { icon: <Check size={14} />, text: 'Cancel anytime, no questions' },
          { icon: <Zap size={14} />, text: 'Instant tier upgrade on payment' },
        ].map(({ icon, text }) => (
          <div key={text} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', fontSize: 12,
          }}>
            <span style={{ color: 'var(--accent)' }}>{icon}</span>
            {text}
          </div>
        ))}
      </div>

      {/* Payment modal */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        apiKeyId={activeApiKeyId}
        onSuccess={() => {
          setModalOpen(false);
          window.location.href = '/';  // redirect to dashboard after upgrade
        }}
      />
    </div>
  );
}
