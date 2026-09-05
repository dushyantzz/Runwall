import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Shield, ChevronRight, ChevronDown, ArrowRight, Code2 
} from 'lucide-react';
import JsonLd, { buildBreadcrumbLd, buildFaqLd } from './JsonLd';
import type { BreadcrumbItem, FaqItem } from './JsonLd';

/* ════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════ */

export interface InternalLink {
  label: string;
  to: string;
}

export interface CodeSnippet {
  title: string;
  language: string;
  code: string;
}

export interface GeoPageData {
  /** Unique page title — goes into <title> and <h1> */
  title: string;
  /** Page meta description (unique per page) */
  description: string;
  /** Canonical path, e.g. "/security/architecture" */
  path: string;
  /** Breadcrumb trail (Home is added automatically) */
  breadcrumbs: BreadcrumbItem[];
  /** 1–2 paragraphs of real content */
  content: string[];
  /** Optional extra structured sections */
  sections?: { heading: string; body: string }[];
  /** 3–5 FAQ questions phrased naturally */
  faqs: FaqItem[];
  /** ≥2 internal links to related pages */
  relatedLinks: InternalLink[];
  /** Optional code snippet (for /docs/* pages) */
  codeSnippet?: CodeSnippet;
  /** Optional badge text override */
  badgeText?: string;
  /** Optional extra React children rendered after content */
  children?: React.ReactNode;
}

/* ════════════════════════════════════════════════════════════
   TEMPLATE COMPONENT
   ════════════════════════════════════════════════════════════ */

const DOMAIN = 'https://runwall.in';

export default function GeoPageTemplate({ data }: { data: GeoPageData }) {
  const canonicalUrl = `${DOMAIN}${data.path}`;
  const ogImage = `${DOMAIN}/logo.svg`;

  // Parse Title for clean presentation
  const cleanFullTitle = data.title
    .replace(/ — Runwall$/, '')
    .replace(/ \| Runwall$/, '')
    .trim();

  let mainHeading = cleanFullTitle;
  let subHeading: string | null = null;

  if (cleanFullTitle.includes(' — ')) {
    const parts = cleanFullTitle.split(' — ');
    mainHeading = parts[0].trim();
    subHeading = parts[1].trim();
  } else if (cleanFullTitle.includes(' – ')) {
    const parts = cleanFullTitle.split(' – ');
    mainHeading = parts[0].trim();
    subHeading = parts[1].trim();
  }

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--body)',
      fontFamily: 'var(--font-body)',
      minHeight: 'calc(100vh - 60px)',
    }}>
      {/* ── HEAD / SEO ── */}
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />

        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={data.title} />
        <meta property="og:description" content={data.description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Runwall" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={data.title} />
        <meta name="twitter:description" content={data.description} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* ── JSON-LD ── */}
      <JsonLd data={buildBreadcrumbLd(data.breadcrumbs)} />
      <JsonLd data={buildFaqLd(data.faqs)} />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 80,
        paddingBottom: 80,
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Subtle grid background */}
        <div className="grid-overlay" />

        {/* Radial accent glow */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 700,
          height: 350,
          background: 'radial-gradient(ellipse, rgba(255, 218, 98, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>

          {/* Large Thin H1 Heading */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.75rem, 5.5vw, 4.5rem)',
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: '-0.035em',
            lineHeight: 1.08,
            maxWidth: 820,
            marginBottom: subHeading ? 16 : 20,
          }}>
            {mainHeading}
          </h1>

          {/* Tagline if separated */}
          {subHeading && (
            <div style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              color: '#d4d4d4',
              fontWeight: 300,
              letterSpacing: '-0.015em',
              lineHeight: 1.45,
              maxWidth: 720,
              marginBottom: 20,
            }}>
              {subHeading}
            </div>
          )}

          {/* Subtitle / Description */}
          <p style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: 'var(--body)',
            fontWeight: 300,
            maxWidth: 620,
            marginBottom: 32,
          }}>
            {data.description}
          </p>

          {/* Hero CTA Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg" style={{ fontWeight: 500 }}>
              Get Started <ArrowRight size={16} />
            </Link>
            <Link to="/docs" className="btn btn-secondary btn-lg">
              View Docs
            </Link>
          </div>
        </div>
      </section>

      {/* ── OVERVIEW & CONTENT ── */}
      <section className="section" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: data.sections && data.sections.length > 0 ? '1fr' : '1fr',
            gap: 40,
            maxWidth: 900,
            margin: '0 auto',
          }}>
            {/* Lead Narrative */}
            <div>
              <span className="mono-label" style={{
                color: 'var(--accent)',
                display: 'block',
                marginBottom: 12,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Architecture Overview
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {data.content.map((para, i) => (
                  <p key={i} style={{
                    fontSize: 16,
                    lineHeight: 1.75,
                    color: 'var(--body)',
                    fontWeight: 300,
                  }}>
                    {para}
                  </p>
                ))}
              </div>
            </div>

            {/* Optional extra children */}
            {data.children}
          </div>
        </div>
      </section>

      {/* ── STRUCTURED SECTIONS (GRID CARDS) ── */}
      {data.sections && data.sections.length > 0 && (
        <section className="section section-border-top" style={{ background: '#050505', paddingTop: 64, paddingBottom: 64 }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="mono-label" style={{
                color: 'var(--accent)',
                display: 'block',
                marginBottom: 8,
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Capabilities & Threat Defenses
              </span>
              <h2 style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 300,
                color: '#ffffff',
                letterSpacing: '-0.025em',
              }}>
                Core Pillars & Controls
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: 20,
            }}>
              {data.sections.map((section, i) => (
                <div 
                  key={i} 
                  className="card"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #222222',
                    borderRadius: 10,
                    padding: '28px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--accent)',
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent-border)',
                        padding: '2px 8px',
                        borderRadius: 4,
                      }}>
                        CONTROL 0{i + 1}
                      </span>
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.25rem',
                      fontWeight: 400,
                      color: '#ffffff',
                      marginBottom: 12,
                      letterSpacing: '-0.015em',
                    }}>
                      {section.heading}
                    </h3>

                    <p style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: 'var(--body)',
                      fontWeight: 300,
                    }}>
                      {section.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CODE SNIPPET (docs / integrations) ── */}
      {data.codeSnippet && (
        <section className="section section-border-top" style={{ paddingTop: 64, paddingBottom: 64 }}>
          <div className="container" style={{ maxWidth: 840 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Code2 size={18} color="var(--accent)" />
              <h3 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: 0,
              }}>
                {data.codeSnippet.title}
              </h3>
            </div>

            <div className="code-block" style={{
              background: '#0a0a0a',
              border: '1px solid #262626',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div className="code-block-header" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                borderBottom: '1px solid #222222',
                background: '#0f0f0f',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  {data.codeSnippet.language}
                </span>
              </div>
              <pre style={{
                padding: '20px',
                margin: 0,
                fontSize: 13,
                lineHeight: 1.65,
                fontFamily: 'var(--font-code)',
                color: '#e5e5e5',
                overflowX: 'auto',
              }}>
                <code>{data.codeSnippet.code}</code>
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ACCORDION ── */}
      <section className="section section-border-top" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="mono-label" style={{
              color: 'var(--accent)',
              display: 'block',
              marginBottom: 8,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Knowledge Base
            </span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              fontWeight: 300,
              color: '#ffffff',
              letterSpacing: '-0.025em',
            }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.faqs.map((faq, i) => (
              <FaqAccordionItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED RESOURCES ── */}
      <section className="section section-border-top" style={{ background: '#050505', paddingTop: 64, paddingBottom: 64 }}>
        <div className="container" style={{ maxWidth: 840 }}>
          <div style={{ marginBottom: 32 }}>
            <span className="mono-label" style={{
              color: 'var(--accent)',
              display: 'block',
              marginBottom: 8,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Explore Further
            </span>
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 300,
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}>
              Related Security & Governance Resources
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 14,
          }}>
            {data.relatedLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: '#0a0a0a',
                  border: '1px solid #222222',
                  borderRadius: 8,
                  textDecoration: 'none',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 400,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-border)';
                  e.currentTarget.style.background = '#141414';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#222222';
                  e.currentTarget.style.background = '#0a0a0a';
                }}
              >
                <span>{link.label}</span>
                <ChevronRight size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM HERO CTA ── */}
      <section className="section section-border-top" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '80px 0' }}>
        <div className="grid-overlay" />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 250,
          background: 'radial-gradient(ellipse, rgba(255, 218, 98, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <Shield size={32} color="var(--accent)" style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{
            maxWidth: 600,
            margin: '0 auto 16px',
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: '-0.03em',
          }}>
            Enforce Zero-Trust Governance on <span style={{ color: 'var(--accent)' }}>AI Agents</span>
          </h2>
          <p style={{
            maxWidth: 480,
            margin: '0 auto 32px',
            color: 'var(--body)',
            fontWeight: 300,
            fontSize: 16,
            lineHeight: 1.6,
          }}>
            Protect your systems from prompt injection, tool poisoning, and data exfiltration in minutes.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link to="/docs" className="btn btn-secondary btn-lg">
              Read the Docs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── ACCORDION ITEM COMPONENT ── */
function FaqAccordionItem({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${open ? 'var(--accent-border)' : '#222222'}`,
        borderRadius: 8,
        background: '#0a0a0a',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          background: 'transparent',
          border: 'none',
          color: '#ffffff',
          fontSize: 15,
          fontWeight: 400,
          textAlign: 'left',
          cursor: 'pointer',
          gap: 16,
        }}
      >
        <span>{faq.question}</span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--accent)',
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div
          style={{
            padding: '0 20px 20px',
            fontSize: 14,
            color: 'var(--body)',
            lineHeight: 1.7,
            fontWeight: 300,
            borderTop: '1px solid #1a1a1a',
            paddingTop: 16,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {faq.answer}
        </div>
      )}
    </div>
  );
}
