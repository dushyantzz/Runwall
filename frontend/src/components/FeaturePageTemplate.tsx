import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

export interface FeaturePageData {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  badgeText: string;

  problem: {
    heading: string;
    description: string;
    points: string[];
  };

  whatItDoes: {
    heading: string;
    description: string;
    points: string[];
  };

  whyItMatters: {
    heading: string;
    description: string;
    benefits: { title: string; description: string }[];
  };

  capabilities: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];

  architecture: {
    description: string;
    layers: { label: string; items: string[] }[];
  };

  workflow: {
    steps: { label: string; description: string }[];
  };

  codeExample: {
    title: string;
    language: string;
    code: string;
  };

  faq: {
    question: string;
    answer: string;
  }[];
}

/* ════════════════════════════════════════════════════════════
   TEMPLATE
   ════════════════════════════════════════════════════════════ */

export default function FeaturePageTemplate({ data }: { data: FeaturePageData }) {
  return (
    <div>
      <FeatureHero data={data} />
      <ProblemSection data={data} />
      <WhatItDoesSection data={data} />
      <WhyItMattersSection data={data} />
      <CapabilitiesSection data={data} />
      <ArchitectureSection data={data} />
      <WorkflowSection data={data} />
      <CodeExampleSection data={data} />
      <FAQSection data={data} />
      <FeatureCTA data={data} />
    </div>
  );
}

/* ── 1. HERO ── */
function FeatureHero({ data }: { data: FeaturePageData }) {
  const Icon = data.icon;
  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 64, paddingBottom: 80 }}>
      <div className="grid-overlay" />
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(110,231,183,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="container" style={{ position: 'relative' }}>
        <div className="animate-fade-up" style={{ marginBottom: 20 }}>
          <span className="badge badge-accent">
            <Icon size={12} />
            {data.badgeText}
          </span>
        </div>
        <h1 className="animate-fade-up delay-100" style={{ maxWidth: 700, marginBottom: 16 }}>
          {data.title}
        </h1>
        <p className="animate-fade-up delay-200" style={{ maxWidth: 560, fontSize: 16, color: 'var(--body)', lineHeight: 1.7, marginBottom: 32 }}>
          {data.subtitle}
        </p>
        <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: 12 }}>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started <ArrowRight size={16} />
          </Link>
          <Link to="/docs" className="btn btn-secondary btn-lg">
            View Docs
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 2. PROBLEM ── */
function ProblemSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>The Problem</span>
            <h2 style={{ marginBottom: 16 }}>{data.problem.heading}</h2>
            <p style={{ color: 'var(--body)', lineHeight: 1.7, marginBottom: 24 }}>{data.problem.description}</p>
          </div>
          <div style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            background: 'var(--card-bg)',
            padding: 24,
          }}>
            {data.problem.points.map((point, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '14px 0',
                borderBottom: i < data.problem.points.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--destructive)',
                  background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 4,
                  flexShrink: 0,
                }}>
                  ✕
                </span>
                <span style={{ fontSize: 13, color: 'var(--body)' }}>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .container > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ── 3. WHAT IT DOES ── */
function WhatItDoesSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>What It Does</span>
          <h2 style={{ marginBottom: 16 }}>{data.whatItDoes.heading}</h2>
          <p style={{ color: 'var(--muted)' }}>{data.whatItDoes.description}</p>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
          maxWidth: 800, margin: '0 auto',
        }}>
          {data.whatItDoes.points.map((point, i) => (
            <div key={i} style={{
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '16px 18px',
              background: 'var(--card-bg)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--body)',
            }}>
              <ChevronRight size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
              {point}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 4. WHY IT MATTERS ── */
function WhyItMattersSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="grid-overlay" />
      <div className="container" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>Why It Matters</span>
          <h2 style={{ marginBottom: 16 }}>{data.whyItMatters.heading}</h2>
          <p style={{ color: 'var(--muted)' }}>{data.whyItMatters.description}</p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {data.whyItMatters.benefits.map((b) => (
            <div key={b.title} style={{
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '24px 20px',
              background: 'var(--card-bg)',
            }}>
              <h4 style={{ fontSize: 14, fontWeight: 450, color: 'var(--heading)', marginBottom: 8 }}>{b.title}</h4>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{b.description}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .container > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ── 5. CAPABILITIES ── */
function CapabilitiesSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref} style={{ background: '#000000' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>Key Capabilities</span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 300, color: '#ffffff' }}>Built for enterprise scale</h2>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderLeft: '1px solid #141414',
          borderRight: '1px solid #141414',
          borderBottom: '1px solid #141414',
          borderTop: '1px solid #141414',
          borderRadius: 8,
          overflow: 'hidden',
        }}>
          {data.capabilities.map((cap, i) => {
            const CapIcon = cap.icon;
            return (
              <div key={cap.title} style={{
                padding: '32px 24px',
                borderRight: (i + 1) % 3 !== 0 ? '1px solid #141414' : 'none',
                borderBottom: i < data.capabilities.length - 3 ? '1px solid #141414' : 'none',
                background: '#000000',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#0a0a0a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#000000';
              }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  border: '1px solid #141414', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: '#080808', marginBottom: 16,
                }}>
                  <CapIcon size={14} color="var(--accent)" />
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 450, color: '#ffffff', marginBottom: 8 }}>{cap.title}</h4>
                <p style={{ fontSize: 12, color: '#777777', lineHeight: 1.5, margin: 0 }}>{cap.description}</p>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .container > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

/* ── 6. ARCHITECTURE ── */
function ArchitectureSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>Architecture</span>
          <h2 style={{ marginBottom: 12 }}>Technical architecture</h2>
          <p style={{ color: 'var(--muted)' }}>{data.architecture.description}</p>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 0,
          border: '1px solid var(--border)', borderRadius: 12,
          overflow: 'hidden', maxWidth: 700, margin: '0 auto',
        }}>
          {data.architecture.layers.map((layer, i) => (
            <div key={layer.label} style={{
              padding: '20px 24px',
              borderBottom: i < data.architecture.layers.length - 1 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'var(--card-bg)' : 'var(--bg-secondary)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--accent)', marginBottom: 10,
              }}>
                {layer.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {layer.items.map((item) => (
                  <span key={item} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    padding: '4px 10px', borderRadius: 4,
                    border: '1px solid var(--border)', color: 'var(--body)',
                    background: 'var(--bg)',
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 7. WORKFLOW ── */
function WorkflowSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>Example Workflow</span>
          <h2>How it works in practice</h2>
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 0,
          maxWidth: 600, margin: '0 auto',
          border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
        }}>
          {data.workflow.steps.map((step, i) => (
            <div key={step.label} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 24px',
              borderBottom: i < data.workflow.steps.length - 1 ? '1px solid var(--border)' : 'none',
              background: 'var(--card-bg)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid var(--accent-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)',
                flexShrink: 0,
                background: 'var(--accent-dim)',
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', marginBottom: 2 }}>{step.label}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 8. CODE EXAMPLE ── */
function CodeExampleSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>Configuration</span>
          <h2>Example configuration</h2>
        </div>
        <div className="code-block">
          <div className="code-block-header">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span style={{ marginLeft: 8 }}>{data.codeExample.title}</span>
          </div>
          <pre>
            <code dangerouslySetInnerHTML={{ __html: highlightCode(data.codeExample.code) }} />
          </pre>
        </div>
      </div>
    </section>
  );
}

function highlightCode(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    .replace(/(".*?")/g, '<span class="string">$1</span>')
    .replace(/\b(true|false|null|none)\b/gi, '<span class="boolean">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
    .replace(/^(\s*\w[\w-]*):/gm, '<span class="property">$1</span>:');
}

/* ── 9. FAQ ── */
function FAQSection({ data }: { data: FeaturePageData }) {
  const ref = useScrollAnimation();
  return (
    <section className="section section-border-top" ref={ref}>
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="mono-label" style={{ display: 'block', marginBottom: 12 }}>FAQ</span>
          <h2>Frequently asked questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.faq.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      overflow: 'hidden',
      background: open ? 'var(--card-hover)' : 'var(--card-bg)',
      transition: 'background 0.2s',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'none',
          border: 'none',
          color: 'var(--heading)',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {question}
        <ChevronDown
          size={16}
          color="var(--muted)"
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{
          padding: '0 20px 16px',
          fontSize: 13,
          color: 'var(--body)',
          lineHeight: 1.7,
          animation: 'fadeIn 0.15s ease-out',
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}

/* ── 10. CTA ── */
function FeatureCTA({ data }: { data: FeaturePageData }) {
  const Icon = data.icon;
  return (
    <section className="section section-border-top" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="grid-overlay" />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 500, height: 250,
        background: 'radial-gradient(ellipse, rgba(110,231,183,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <Icon size={32} color="var(--accent)" />
        </div>
        <h2 style={{ maxWidth: 500, margin: '0 auto 16px' }}>
          Start using <span style={{ color: 'var(--accent)' }}>{data.title.toLowerCase()}</span> today
        </h2>
        <p style={{ maxWidth: 440, margin: '0 auto 32px', color: 'var(--muted)' }}>
          Deploy in minutes. Integrate with your existing agent infrastructure.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link to="/signup" className="btn btn-primary btn-lg">
            Get Started Free <ArrowRight size={16} />
          </Link>
          <Link to="/docs" className="btn btn-secondary btn-lg">
            Read the Docs
          </Link>
        </div>
      </div>
    </section>
  );
}
