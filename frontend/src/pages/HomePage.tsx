import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Lock, Database, Play, FileText,
  Clock, ArrowUpRight, ChevronDown
} from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useAuth } from '../hooks/AuthContext';
import RunwallFlowDiagram from '../components/RunwallFlowDiagram';

// Platform Logo Assets
import kiroLogo from '../assets/kiro.svg';
import traeLogo from '../assets/trae.svg';
import qoderLogo from '../assets/qoder.svg';
import cursorLogo from '../assets/cursor.svg';
import claudeLogo from '../assets/claude_code.svg';
import copilotLogo from '../assets/copilot.svg';
import codexLogo from '../assets/codex.svg';
import clineLogo from '../assets/cline.svg';
import windsurfLogo from '../assets/windsurf.svg';

const tickerItems = [
  { name: 'KIRO', logo: kiroLogo, invert: false },
  { name: 'TRAE', logo: traeLogo, invert: true },
  { name: 'Qoder', logo: qoderLogo, invert: true },
  { name: 'CURSOR', logo: cursorLogo, invert: false },
  { name: 'Claude', logo: claudeLogo, invert: true },
  { name: 'Copilot', logo: copilotLogo, invert: true },
  { name: 'Codex', logo: codexLogo, invert: false },
  { name: 'Cline', logo: clineLogo, invert: true },
  { name: 'Windsurf', logo: windsurfLogo, invert: true },
];

/* ════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════ */


/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function HomePage() {
  return (
    <div style={{ background: '#000000', color: '#b4b4b4', minHeight: '100vh' }}>
      <Helmet>
        <title>Runwall — Execution Governance for AI Agents</title>
        <meta name="description" content="Runwall is an agent-native execution governance platform. Policy enforcement, identity gateway, risk scoring, taint tracking, approval workflows, and audit trails for AI agents on MCP servers." />
        <link rel="canonical" href="https://runwall.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://runwall.vercel.app/" />
        <meta property="og:title" content="Runwall — Execution Governance for AI Agents" />
        <meta property="og:description" content="Agent-native execution governance. Policy engine, risk scoring, taint tracking, approval workflows, and audit trails for AI agents on MCP servers." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Runwall — Execution Governance for AI Agents" />
        <meta name="twitter:description" content="Agent-native execution governance. Policy engine, risk scoring, taint tracking, approval workflows, and audit trails for AI agents on MCP servers." />
      </Helmet>
      <HeroSection />
      <CompatibilityTicker />
      <FeatureBentoGrid />
      <BranchingWorkflowSection />
      <UserFeedbackSection />
      <FAQSection />
      <CTASection />
    </div>
  );
}

/* ── 1. HERO SECTION ── */
function HeroSection() {
  const { user } = useAuth();

  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 'clamp(100px, 14vw, 160px)',
      paddingBottom: 'clamp(60px, 10vw, 100px)',
      borderBottom: '1px solid #333333'
    }}>
      {/* Grid overlay */}
      <div className="grid-overlay" style={{ opacity: 0.8 }} />

      <div className="container" style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
        {/* Product Hunt Badge + Sarvam Badge */}
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 12 }}>
          <a href="https://www.producthunt.com/products/runwall?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-runwall" target="_blank" rel="noopener noreferrer">
            <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1193799&amp;theme=light&amp;t=1783834347535" alt="Runwall - The firewall and execution governance gateway for AI agents | Product Hunt" style={{ width: 200, height: 43 }} width="200" height="43" loading="lazy" />
          </a>

          {/* Backed By Sarvam.ai */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px 10px', 
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid #222222',
            borderRadius: '24px',
            padding: '6px 16px',
            marginTop: 4,
            maxWidth: '100%',
          }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Backed by</span>
            <span style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 800, 
              fontSize: '17px', 
              letterSpacing: '-0.02em',
              color: '#ffffff',
              textTransform: 'none',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>
              sarvam<span style={{ color: '#7c8ba1' }}>.ai</span>
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Startup Program</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100" style={{
          fontSize: 'clamp(1.875rem, 6vw, 3.5rem)',
          maxWidth: 1100,
          margin: '0 auto 24px',
          lineHeight: 1.2,
          fontWeight: 100,
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}>
          You wouldn't deploy code without tests.
          <br />
          <span style={{ color: 'var(--accent)' }}>Don't deploy agents without Runwall.</span>
        </h1>

        {/* Subheading */}
        <p className="animate-fade-up delay-200" style={{
          maxWidth: 720,
          margin: '0 auto 36px',
          fontSize: 'clamp(15px, 2.5vw, 17px)',
          fontStyle: 'italic',
          color: '#b4b4b4',
          lineHeight: 1.6,
        }}>
          Runwall sits between your agent and everything it can touch — blocking bad actions, logging every move, and flagging anything risky before damage is done
        </p>


        {/* Action Buttons */}
        <div className="animate-fade-up delay-300 hero-cta-group" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 48 }}>
          {user ? (
            <Link to="/docs" className="btn-trendy-primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="btn-trendy-primary">
              Start Building Today
            </Link>
          )}
          <Link to="/docs" className="btn-trendy-secondary">
            Read Docs
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── 1.1 COMPATIBILITY TICKER ── */
function CompatibilityTicker() {
  return (
    <div className="ticker-container" style={{ padding: '32px 24px', fontSize: '17px' }}>
      <div className="ticker-title" style={{ fontSize: '15px' }}>Works perfectly with</div>
      <div className="ticker-wrap">
        <div className="ticker-move" style={{ gap: '96px' }}>
          {tickerItems.concat(tickerItems).map((item, idx) => (
            <span className="ticker-item" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={item.logo}
                alt={item.name}
                style={{
                  width: '26px',
                  height: '26px',
                  objectFit: 'contain',
                  filter: item.invert ? 'brightness(0) invert(0.85)' : 'none'
                }}
              />
              <span style={{ fontSize: '16px', fontWeight: 600 }}>{item.name}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 2. FEATURE BENTO GRID ── */
function FeatureBentoGrid() {
  return (
    <section style={{
      background: '#000000',
      borderBottom: '1px solid #333333',
      paddingTop: 80,
      paddingBottom: 80,
      position: 'relative'
    }}>
      <div className="container">
        {/* Header grid row */}
        <div className="bento-header-grid">
          <div>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: 300,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: 16
            }}>
              Everything You Need for Governance
            </h2>
            <p style={{
              color: '#777777',
              fontSize: 13,
              maxWidth: 320,
              lineHeight: 1.5
            }}>
              Built-in policy, identity, risk, and control components that secure agent actions automatically.
            </p>
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', borderLeft: '1px solid #333333', paddingLeft: 40 }} className="bento-header-overlay-col">
            {/* Background grid representation */}
            <div className="grid-overlay" style={{ opacity: 0.4 }} />
          </div>
        </div>

        {/* Bento Grid */}
        <div className="homepage-bento-grid">

        <style>{`
          .bento-header-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            border-bottom: 1px solid #333333;
            padding-bottom: 40;
            margin-bottom: 0;
          }

          .homepage-bento-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            border-left: 1px solid #333333;
            border-right: 1px solid #333333;
            border-bottom: 1px solid #333333;
          }

          @media (max-width: 1024px) {
            .homepage-bento-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .bento-header-grid {
              grid-template-columns: 1fr;
            }
            .bento-header-overlay-col {
              border-left: none !important;
              padding-left: 0 !important;
              height: 60px;
              margin-top: 20px;
            }
          }

          @media (max-width: 640px) {
            .homepage-bento-grid {
              grid-template-columns: 1fr;
            }
            .homepage-bento-grid > a {
              border-right: none !important;
            }
          }
        `}</style>
          {/* Card 1: Tool / MCP Registry */}
          <BentoCard
            to="/features/tool-mcp-registry"
            title="Tool / MCP Registry"
            desc="A centralized catalog of allowed tools and schemas for your agents."
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              marginTop: 16,
              color: '#777'
            }}>
              <span style={{ border: '1px solid #1c1c1c', padding: '3px 8px', borderRadius: 4, background: '#080808' }}>tool</span>
              <span style={{ opacity: 0.5 }}>┈┈┈┈</span>
              <span style={{ border: '1px solid #1c1c1c', padding: '3px 8px', borderRadius: 4, background: '#080808' }}>policy</span>
            </div>
          </BentoCard>

          {/* Card 2: Identity & Access Control */}
          <BentoCard
            to="/features/identity-access-control"
            title="Identity & Access Control"
            desc="Cryptographic agent identity, OAuth authentication, and scoped access."
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 20
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', color: 'var(--accent)' }}>
                <Lock size={14} />
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', color: '#ffedd5' }}>
                <span style={{ fontSize: 10, fontWeight: 800 }}>G</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', color: '#b4b4b4' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>id</span>
              </div>
            </div>
          </BentoCard>

          {/* Card 3: Audit / Evidence / Replay */}
          <BentoCard
            to="/features/audit-evidence-replay"
            title="Audit & Evidence Replay"
            desc="Store and replay agent executions with immutable audit trails."
            borderRight={false}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 8,
              marginTop: 20
            }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222' }}>
                <FileText size={11} color="#b4b4b4" />
              </div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222' }}>
                <Play size={11} color="#b4b4b4" />
              </div>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #222' }}>
                <Database size={11} color="#b4b4b4" />
              </div>
            </div>
          </BentoCard>

          {/* Card 4: Runtime Interceptor / Gateway */}
          <BentoCard
            to="/features/runtime-interceptor"
            title="Runtime Interceptor"
            desc="Intercept agent-to-tool API calls and block dangerous side effects."
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignItems: 'center',
              marginTop: 12
            }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', border: '1px solid #1c1c1c', padding: '2px 8px', borderRadius: 4, background: '#0a0a0a' }}>
                &lt;Pre-Execution Gate&gt;
              </span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', border: '1px solid #1c1c1c', padding: '2px 8px', borderRadius: 4, background: '#0a0a0a' }}>
                &lt;Enforce Policy&gt;
              </span>
            </div>
          </BentoCard>

          {/* Card 5: Risk Scoring Engine */}
          <BentoCard
            to="/features/risk-scoring-engine"
            title="Risk Scoring Engine"
            desc="Score composite risk levels dynamically based on action parameters."
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 16
            }}>
              <div style={{
                width: 40,
                height: 40,
                border: '1px solid #1c1c1c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: '#080808'
              }}>
                <ArrowUpRight size={16} color="var(--accent)" />
              </div>
            </div>
          </BentoCard>

          {/* Card 6: Taint Tracking Engine */}
          <BentoCard
            to="/features/taint-tracking-engine"
            title="Taint Tracking Engine"
            desc="Track data lineage, contamination, and sensitive PII propagation."
            borderRight={false}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              marginTop: 20
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(110, 231, 183, 0.1)',
                border: '1px solid rgba(110, 231, 183, 0.3)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: 10,
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%' }} />
                Tony
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: 'rgba(192, 132, 252, 0.1)',
                border: '1px solid rgba(192, 132, 252, 0.3)',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: 10,
                color: '#c084fc',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ width: 4, height: 4, background: '#c084fc', borderRadius: '50%' }} />
                Leo
              </div>
            </div>
          </BentoCard>

          {/* Card 7: Quotas / Budgets / Limits */}
          <BentoCard
            to="/features/quotas-budgets-rate-limits"
            title="Quotas & Rate Limits"
            desc="Apply usage limits, call throttling, and token spending budgets."
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 16
            }}>
              <Clock size={14} color="#777" />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                border: '1px solid #1c1c1c',
                borderRadius: 4,
                padding: '3px 8px',
                background: '#080808',
                color: '#b4b4b4'
              }}>
                Rate: 60/min
              </span>
            </div>
          </BentoCard>

          {/* Card 8: Approval Workflow Engine */}
          <BentoCard
            to="/features/approval-workflow-engine"
            title="Approval Workflows"
            desc="Escalation paths, human-in-the-loop approvals, and SLA tracking."
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
              marginTop: 20
            }}>
              <div style={{
                display: 'flex',
                background: '#0f0f0f',
                border: '1px solid #1c1c1c',
                borderRadius: '20px',
                padding: 2,
              }}>
                <span style={{
                  background: 'var(--accent)',
                  color: '#000',
                  borderRadius: '20px',
                  padding: '2px 8px',
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}>
                  HUMAN
                </span>
                <span style={{
                  color: '#777',
                  padding: '2px 8px',
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}>
                  AGENT
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Card 9: Sandboxing / Execution Profiles */}
          <BentoCard
            to="/features/sandboxing-execution-profiles"
            title="Sandboxing & Profiles"
            desc="Isolate agent containers and configure execution safety limits."
            borderRight={false}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 16
            }}>
              <div style={{
                width: 70,
                height: 24,
                border: '1px dashed #333',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: '#777',
                fontFamily: 'var(--font-mono)'
              }}>
                [ isolated ]
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  to,
  title,
  desc,
  children,
  borderRight = true
}: {
  to: string;
  title: string;
  desc: string;
  children: React.ReactNode;
  borderRight?: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        padding: '32px 24px',
        borderRight: borderRight ? '1px solid #333333' : 'none',
        borderBottom: '1px solid #333333',
        background: '#000000',
        textDecoration: 'none',
        transition: 'background 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#0a0a0a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#000000';
      }}
    >
      <h4 style={{
        fontSize: 14,
        fontWeight: 450,
        color: '#ffffff',
        marginBottom: 8,
        letterSpacing: '-0.01em'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: 12,
        color: '#777777',
        lineHeight: 1.5,
        marginBottom: 16,
        flex: 1
      }}>
        {desc}
      </p>
      <div style={{ marginTop: 'auto' }}>
        {children}
      </div>
    </Link>
  );
}

function BranchingWorkflowSection() {
  const ref = useScrollAnimation();

  return (
    <section className="section section-border-top" ref={ref} style={{
      position: 'relative',
      overflow: 'hidden',
      background: '#000000',
      paddingTop: 96,
      paddingBottom: 96,
      borderBottom: '1px solid #333333'
    }}>
      <div className="grid-overlay" style={{ opacity: 0.6 }} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Title */}
        <div style={{ marginBottom: 64 }}>
          <h2 className="branching-section-title" style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: 300,
            color: '#ffffff',
            marginBottom: 16,
            letterSpacing: '-0.02em'
          }}>
            Safe for Agents to Operate
          </h2>
          <p style={{
            color: '#777777',
            fontSize: 14,
            maxWidth: 550,
            lineHeight: 1.6
          }}>
            Deploy agent policies safely. Test security policies in shadow dry-run branches and intercept high-risk actions before they hit production systems.
          </p>
        </div>

        {/* Dynamic Timeline Branches Diagram */}
        <div style={{
          position: 'relative',
          margin: '0 auto',
          maxWidth: 1280,
          zIndex: 5
        }}>
          <RunwallFlowDiagram />
        </div>

      </div>
    </section>
  );
}

/* ── 5. USER FEEDBACK SECTION ── */
const ProductHuntLogo = () => (
  <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="20" fill="#DA552F" />
    <path d="M22.6667 20H17.3333V14.6667H22.6667C24.1395 14.6667 25.3333 15.8606 25.3333 17.3333C25.3333 18.8061 24.1395 20 22.6667 20ZM22.6667 10.6667H13.3333V29.3333H17.3333V24H22.6667C26.3486 24 29.3333 21.0152 29.3333 17.3333C29.3333 13.6514 26.3486 10.6667 22.6667 10.6667Z" fill="white" />
  </svg>
);

const feedbackItemsRow1 = [
  {
    name: 'Azad Fındık',
    handle: '@azadfndk143609',
    badge: 'Product Hunt Hunter',
    avatarBg: '#1e3a8a',
    initial: 'AF',
    text: 'Tried the taint tracking on a couple of agent workflows and it actually caught a prompt injection I had missed. Approval workflows feel solid for a real team setup.'
  },
  {
    name: 'Gal Dayan',
    handle: '@galdayan',
    badge: 'Verified Hunter',
    avatarBg: '#581c87',
    initial: 'GD',
    text: "The 'taint attached to state not the string' framing answers my exact worry. If the whole session gets flagged once un-trusted input enters, the paraphrase doesn't matter anymore. That's a meaningfully different approach than most taint-tracking tools I've seen."
  },
  {
    name: 'Nurullah Bekik',
    handle: '@nurullahbekik',
    badge: 'Product Hunt Hunter',
    avatarBg: '#065f46',
    initial: 'NB',
    text: 'The taint tracking is genuinely useful - finally a clear view of which data an agent touched end to end. Setup took longer than expected, but once policies clicked in, approvals felt smooth and the audit trail was actually readable.'
  },
  {
    name: 'Henry Jung',
    handle: '@henryjung',
    badge: 'Verified Hunter',
    avatarBg: '#78350f',
    initial: 'HJ',
    text: 'Congrats on the launch. I run AI agents that execute real actions in my product and the runtime boundary is what keeps me honest, static permission lists never survive contact with real usage.'
  }
];

const feedbackItemsRow2 = [
  {
    name: 'Nurullah Bekik',
    handle: '@nurullahbekik',
    badge: 'Product Hunt Hunter',
    avatarBg: '#065f46',
    initial: 'NB',
    text: 'Once policies clicked in, approvals felt smooth and the audit trail was actually readable. Really great execution for agent governance!'
  },
  {
    name: 'Henry Jung',
    handle: '@henryjung',
    badge: 'Verified Hunter',
    avatarBg: '#78350f',
    initial: 'HJ',
    text: 'Static permission lists never survive contact with real usage. The runtime execution boundary of Runwall is what keeps our agent integrations safe.'
  },
  {
    name: 'Gal Dayan',
    handle: '@galdayan',
    badge: 'Verified Hunter',
    avatarBg: '#581c87',
    initial: 'GD',
    text: 'Session-level containment is a meaningfully different approach than standard lineage trackers. Impressed by the security architecture!'
  },
  {
    name: 'Azad Fındık',
    handle: '@azadfndk143609',
    badge: 'Product Hunt Hunter',
    avatarBg: '#1e3a8a',
    initial: 'AF',
    text: 'Caught a prompt injection I had missed in testing. Approval workflows feel extremely solid for a real team setup.'
  }
];

function UserFeedbackSection() {
  const ref = useScrollAnimation();

  const row1Duplicates = [...feedbackItemsRow1, ...feedbackItemsRow1, ...feedbackItemsRow1];
  const row2Duplicates = [...feedbackItemsRow2, ...feedbackItemsRow2, ...feedbackItemsRow2];

  return (
    <section className="section section-border-top" ref={ref} style={{ background: '#000000', padding: '96px 0', overflow: 'hidden' }}>
      <div className="container" style={{ textAlign: 'center', marginBottom: 56 }}>
        <span className="mono-label" style={{ marginBottom: 12, display: 'block', fontSize: 11 }}>COMMUNITY FEEDBACK</span>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 300, color: '#ffffff', letterSpacing: '-0.02em', marginBottom: 16 }}>
          User Feedback That Motivates Us
        </h2>
        <p style={{ color: '#777777', fontSize: 14, maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Real reviews and discussions from developers and security leaders on Product Hunt.
        </p>
      </div>

      {/* Moving Marquee Container */}
      <div className="feedback-marquee-wrapper" style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}>

        {/* Row 1: Leftward moving track */}
        <div className="marquee-track marquee-track-left">
          {row1Duplicates.map((item, idx) => (
            <a
              key={`row1-${idx}`}
              href="https://www.producthunt.com/products/runwall"
              target="_blank"
              rel="noopener noreferrer"
              className="feedback-card"
            >
              <div className="feedback-card-header">
                <div className="feedback-avatar" style={{ background: item.avatarBg }}>
                  {item.initial}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="feedback-name">{item.name}</div>
                  <div className="feedback-handle">{item.handle}</div>
                </div>
                <ProductHuntLogo />
              </div>

              {/* Star Rating */}
              <div className="feedback-stars">
                {'★'.repeat(5)}
              </div>

              {/* Comment Text */}
              <p className="feedback-text">
                "{item.text}"
              </p>

              {/* Card Footer */}
              <div className="feedback-footer">
                <span className="feedback-badge">{item.badge}</span>
                <span className="feedback-time">Product Hunt ↗</span>
              </div>
            </a>
          ))}
        </div>

        {/* Row 2: Rightward moving track */}
        <div className="marquee-track marquee-track-right">
          {row2Duplicates.map((item, idx) => (
            <a
              key={`row2-${idx}`}
              href="https://www.producthunt.com/products/runwall"
              target="_blank"
              rel="noopener noreferrer"
              className="feedback-card"
            >
              <div className="feedback-card-header">
                <div className="feedback-avatar" style={{ background: item.avatarBg }}>
                  {item.initial}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="feedback-name">{item.name}</div>
                  <div className="feedback-handle">{item.handle}</div>
                </div>
                <ProductHuntLogo />
              </div>

              {/* Star Rating */}
              <div className="feedback-stars">
                {'★'.repeat(5)}
              </div>

              {/* Comment Text */}
              <p className="feedback-text">
                "{item.text}"
              </p>

              {/* Card Footer */}
              <div className="feedback-footer">
                <span className="feedback-badge">{item.badge}</span>
                <span className="feedback-time">Product Hunt ↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          will-change: transform;
        }

        .marquee-track-left {
          animation: marquee-scroll-left 50s linear infinite;
        }

        .marquee-track-right {
          animation: marquee-scroll-right 55s linear infinite;
        }

        .feedback-marquee-wrapper:hover .marquee-track {
          animation-play-state: paused;
        }

        @keyframes marquee-scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }

        @keyframes marquee-scroll-right {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0); }
        }

        .feedback-card {
          width: 380px;
          background: #000000;
          border: 1px solid #333333;
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          text-decoration: none;
          color: inherit;
          transition: background 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
        }

        .feedback-card:hover {
          background: #0a0a0a;
          border-color: #555555;
        }

        @media (max-width: 480px) {
          .feedback-card {
            width: 290px !important;
            padding: 16px !important;
          }
          .feedback-text {
            font-size: 12.5px !important;
          }
        }

        .feedback-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .feedback-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          font-family: var(--font-mono);
          border: 1px solid #333333;
        }

        .feedback-name {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
          font-family: var(--font-display);
        }

        .feedback-handle {
          font-size: 11px;
          color: #777777;
          font-family: var(--font-mono);
          margin-top: 2px;
        }

        .feedback-stars {
          color: var(--accent);
          font-size: 14px;
          letter-spacing: 2px;
          margin-bottom: 14px;
        }

        .feedback-text {
          font-size: 13.5px;
          color: #c0c0c0;
          line-height: 1.6;
          font-family: var(--font-body);
          margin: 0 0 20px 0;
          flex: 1;
        }

        .feedback-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #222222;
          padding-top: 14px;
          margin-top: auto;
        }

        .feedback-badge {
          font-size: 10px;
          font-weight: 700;
          font-family: var(--font-mono);
          color: var(--accent);
          background: rgba(255, 218, 98, 0.08);
          border: 1px solid rgba(255, 218, 98, 0.2);
          border-radius: 20px;
          padding: 2px 8px;
          text-transform: uppercase;
        }

        .feedback-time {
          font-size: 11px;
          color: #666666;
          font-family: var(--font-mono);
        }

        .feedback-card:hover .feedback-time {
          color: var(--accent);
        }
      `}</style>
    </section>
  );
}


/* ── 7. FAQ SECTION ── */
const faqItems = [
  {
    q: 'What is Runwall?',
    a: 'Runwall is an agent-native execution governance platform that sits between AI agents and the tools they call. It enforces zero-trust security policies, validates agent identity, scores risk for every action, tracks sensitive data flow, and maintains a full audit trail — ensuring AI agents operate safely and compliantly.'
  },
  {
    q: 'How does Runwall secure MCP servers?',
    a: 'Runwall acts as a security gateway in front of MCP (Model Context Protocol) servers. Every tool invocation from an AI agent passes through Runwall\'s policy engine (powered by Open Policy Agent) before execution. Runwall validates the agent\'s identity, evaluates the action against defined policies, scores the risk, checks for sensitive data taint, and either allows, blocks, or routes the action for human approval.'
  },
  {
    q: 'What is zero-trust AI agent governance?',
    a: 'Zero-trust AI agent governance means no agent action is trusted by default, regardless of the agent\'s identity or the simplicity of the action. Every tool call is verified, authorized, and logged. Runwall implements this model by requiring explicit policy approval for every action, enforcing least-privilege access, and maintaining immutable audit trails.'
  },
  {
    q: 'Which AI agents work with Runwall?',
    a: 'Runwall works with all major MCP-compatible AI agents including Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Kiro, Trae, Windsurf, Cline, Qoder, Roo Code, and any custom agents that use the Model Context Protocol.'
  },
  {
    q: 'What is taint tracking in Runwall?',
    a: 'Taint tracking in Runwall monitors the propagation of sensitive data (such as API keys, PII, or confidential content) through agent actions. When an agent reads sensitive data from one source, that taint label propagates to any downstream actions, enabling Runwall to block or flag operations that would cause a data leak.'
  },
  {
    q: 'Does Runwall support approval workflows?',
    a: 'Yes. Runwall includes a configurable Approval Workflow Engine that can require human-in-the-loop approval before executing high-risk agent actions. Teams can define which action types, risk score thresholds, or policy conditions trigger an approval request.'
  },
  {
    q: 'Is there a free plan for Runwall?',
    a: 'Yes, Runwall offers a free tier suitable for individual developers and small teams exploring AI agent governance. A Pro plan is also available for teams needing advanced features and production-grade governance.'
  },
  {
    q: 'How does Runwall differ from a traditional API gateway?',
    a: 'Traditional API gateways handle traffic routing, rate limiting, and basic auth. Runwall is purpose-built for AI agents: it understands the MCP protocol, enforces semantic policies (not just HTTP rules), tracks data taint across multi-step agent workflows, supports human approval gates, and provides agentic-context audit logs — capabilities that generic API gateways do not provide.'
  },
];

function FAQSection() {
  const ref = useScrollAnimation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section className="section section-border-top" ref={ref} style={{ background: '#000000', borderBottom: '1px solid #333333' }}>
      <div className="container">
        <div style={{ marginBottom: 48 }}>
          <span className="mono-label" style={{ marginBottom: 12, display: 'block', fontSize: 11 }}>FAQ</span>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            fontWeight: 300,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            marginBottom: 8,
          }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#777777', fontSize: 14, maxWidth: 520, lineHeight: 1.6 }}>
            Everything you need to know about Runwall and AI agent governance.
          </p>
        </div>

        <div style={{ maxWidth: 800, borderTop: '1px solid #222222' }}>
          {faqItems.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  id={`faq-q-${i}`}
                  aria-controls={`faq-a-${i}`}
                >
                  <span>{item.q}</span>
                  <ChevronDown size={18} className={`faq-chevron${isOpen ? ' open' : ''}`} />
                </button>
                <div
                  className={`faq-answer${isOpen ? ' open' : ''}`}
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  style={{ maxHeight: isOpen ? '400px' : '0' }}
                >
                  <div className="faq-answer-inner">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── 6. CTA SECTION ── */
function CTASection() {
  const { user } = useAuth();

  return (
    <section className="section section-border-top" style={{ position: 'relative', overflow: 'hidden', background: '#000000' }}>
      <div className="grid-overlay" />
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-55%, -55%)',
        width: 600,
        height: 300,
        background: 'radial-gradient(ellipse, rgba(110,231,183,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 300, color: '#ffffff', marginBottom: 16 }}>
          Ready to govern your <span style={{ color: 'var(--accent)' }}>AI agents</span>?
        </h2>
        <p style={{ maxWidth: 480, margin: '0 auto 32px', color: '#777777', fontSize: 13 }}>
          Deploy enterprise-grade execution governance in minutes.
          Start free, scale to millions of agent actions.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }} className="cta-button-group">
          {user ? (
            <Link to="/docs" className="btn-trendy-primary">
              Go to Dashboard
            </Link>
          ) : (
            <Link to="/signup" className="btn-trendy-primary">
              Get Started Free
            </Link>
          )}
          <Link to="/contact" className="btn-trendy-secondary">
            Talk to Sales
          </Link>
        </div>
      </div>
    </section>
  );
}
