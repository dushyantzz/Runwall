import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Check, Star, Lock, Database, Play, FileText,
  Clock, AlertTriangle, ArrowUpRight, X
} from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

/* ════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════ */

const testimonials = [
  {
    quote: "AegisGuard gave us the confidence to deploy autonomous agents in production. The policy engine alone saved us months of custom development.",
    author: "Sarah Chen",
    role: "VP of Engineering, Meridian AI",
  },
  {
    quote: "The audit trail and replay capabilities are exactly what our compliance team needed. We passed our SOC 2 audit with flying colors.",
    author: "Marcus Rivera",
    role: "CISO, Nexus Financial",
  },
  {
    quote: "Runtime interception with sub-millisecond overhead. We process 50M agent actions daily without breaking a sweat.",
    author: "Dr. Priya Patel",
    role: "CTO, Autonomous Systems Corp",
  },
];

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [activeToggle, setActiveToggle] = useState<'human' | 'agent'>('human');

  return (
    <div style={{ background: '#000000', color: '#b4b4b4', minHeight: '100vh' }}>
      <HeroSection activeToggle={activeToggle} setActiveToggle={setActiveToggle} />
      <FeatureBentoGrid />
      <BranchingWorkflowSection activeToggle={activeToggle} setActiveToggle={setActiveToggle} />
      <TestimonialSection />
      <CTASection />
    </div>
  );
}

/* ── 1. HERO SECTION ── */
function HeroSection({
  activeToggle: _,
  setActiveToggle: __
}: {
  activeToggle: 'human' | 'agent';
  setActiveToggle: (val: 'human' | 'agent') => void;
}) {
  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 100,
      paddingBottom: 80,
      borderBottom: '1px solid #141414'
    }}>
      {/* Grid overlay */}
      <div className="grid-overlay" style={{ opacity: 0.8 }} />

      <div className="container" style={{ position: 'relative', textAlign: 'center', zIndex: 10 }}>
        {/* Headline */}
        <h1 className="animate-fade-up delay-100" style={{
          fontSize: '3.75rem',
          maxWidth: 900,
          margin: '0 auto 24px',
          lineHeight: 1.1,
          fontWeight: 300,
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}>
          <span style={{ color: 'var(--accent)' }}>The Agent-Native</span>
          <br />
          Execution Governance Platform
        </h1>

        {/* Subheading */}
        <p className="animate-fade-up delay-200" style={{
          maxWidth: 620,
          margin: '0 auto 36px',
          fontSize: 14,
          color: '#b4b4b4',
          lineHeight: 1.6,
        }}>
          Policy engine, identity gateway, risk scoring, taint tracking, approvals, and sandboxing.
          Every component built for AI autonomous agents to operate safely end-to-end through CLI and tools.
        </p>

        {/* Cute retro robot */}
        <div className="animate-fade-up delay-200" style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 32
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <div style={{
              width: 20,
              height: 6,
              background: '#777777',
              borderRadius: '2px 2px 0 0',
              transform: 'rotate(-10deg) translate(-2px, 0px)'
            }} />
            <div style={{
              background: 'var(--accent)',
              width: 24,
              height: 18,
              borderRadius: '4px',
              position: 'relative',
              border: '2px solid #000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              padding: '0 2px'
            }}>
              <div style={{ width: 4, height: 4, background: '#000', borderRadius: '50%' }} />
              <div style={{ width: 4, height: 4, background: '#000', borderRadius: '50%' }} />
            </div>
            <div style={{
              display: 'flex',
              gap: 4
            }}>
              <div style={{ width: 4, height: 6, background: 'var(--accent)', borderRadius: '1px' }} />
              <div style={{ width: 4, height: 6, background: 'var(--accent)', borderRadius: '1px' }} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="animate-fade-up delay-300" style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 64 }}>
          <Link to="/signup" style={{
            background: '#ffffff',
            color: '#000000',
            fontWeight: 600,
            fontSize: 15,
            padding: '12px 32px',
            borderRadius: '6px',
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Start Building Today
          </Link>
          <Link to="/docs" style={{
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #ffffff',
            fontWeight: 500,
            fontSize: 15,
            padding: '12px 32px',
            borderRadius: '6px',
            textDecoration: 'none',
            transition: 'border-color 0.2s, background 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ffffff';
            e.currentTarget.style.background = '#111';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#ffffff';
            e.currentTarget.style.background = '#000';
          }}
          >
            Read Docs
          </Link>
        </div>

      </div>
    </section>
  );
}

/* ── 2. FEATURE BENTO GRID ── */
function FeatureBentoGrid() {
  return (
    <section style={{
      background: '#000000',
      borderBottom: '1px solid #141414',
      paddingTop: 80,
      paddingBottom: 80,
      position: 'relative'
    }}>
      <div className="container">
        {/* Header grid row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          borderBottom: '1px solid #141414',
          paddingBottom: 40,
          marginBottom: 0
        }}>
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
          <div style={{ position: 'relative', overflow: 'hidden', borderLeft: '1px solid #141414', paddingLeft: 40 }}>
            {/* Background grid representation */}
            <div className="grid-overlay" style={{ opacity: 0.4 }} />
          </div>
        </div>

        {/* Bento Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderLeft: '1px solid #141414',
          borderRight: '1px solid #141414',
          borderBottom: '1px solid #141414',
        }}>
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
        borderRight: borderRight ? '1px solid #141414' : 'none',
        borderBottom: '1px solid #141414',
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

/* ── 3. BRANCHING WORKFLOW SECTION ── */
function BranchingWorkflowSection({
  activeToggle,
  setActiveToggle
}: {
  activeToggle: 'human' | 'agent';
  setActiveToggle: (val: 'human' | 'agent') => void;
}) {
  const ref = useScrollAnimation();

  return (
    <section className="section section-border-top" ref={ref} style={{
      position: 'relative',
      overflow: 'hidden',
      background: '#000000',
      paddingTop: 96,
      paddingBottom: 96,
      borderBottom: '1px solid #141414'
    }}>
      <div className="grid-overlay" style={{ opacity: 0.6 }} />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Title */}
        <div style={{ marginBottom: 64 }}>
          <h2 style={{
            fontSize: '2.5rem',
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
          padding: '80px 0',
          minHeight: 320,
          margin: '0 auto',
          maxWidth: 900
        }}>
          {/* Main Axis Line */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: '#222222',
            zIndex: 1
          }} />

          {/* Time ticks on main axis */}
          {[
            { left: '20%', label: '09:45' },
            { left: '40%', label: '11:45' },
            { left: '60%', label: '16:45' },
            { left: '80%', label: '18:45' },
          ].map((tick, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: tick.left,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#333' }} />
              <div style={{
                position: 'absolute',
                top: 10,
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                color: '#555555'
              }}>
                {tick.label}
              </div>
            </div>
          ))}

          {/* Badge: LIVE Production */}
          <div style={{
            position: 'absolute',
            left: '3%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 4,
            background: '#090909',
            border: '1px solid #141414',
            borderRadius: '4px',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              background: '#FFDA62',
              borderRadius: '50%',
              boxShadow: '0 0 8px #FFDA62'
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.05em'
            }}>
              LIVE
            </span>
            <span style={{ fontSize: 10, color: '#777' }}>Production</span>
          </div>

          {/* Upper Branch: policy-dryrun */}
          <svg style={{
            position: 'absolute',
            top: 0,
            left: '20%',
            width: '60%',
            height: '50%',
            pointerEvents: 'none',
            zIndex: 2
          }}>
            <path
              d="M 0,75 C 60,0 200,0 250,0"
              fill="none"
              stroke="#222"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
            <path
              d="M 250,0 L 400,0 C 450,0 520,0 580,75"
              fill="none"
              stroke="#FFDA62"
              strokeWidth="1.5"
            />
          </svg>

          {/* Upper Branch components */}
          <div style={{
            position: 'absolute',
            left: '27%',
            top: '2%',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {/* Added Rego Check Pill */}
            <div style={{
              background: '#0c0c0c',
              border: '1px solid #1c1c1c',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: 'var(--accent)'
            }}>
              <span style={{ width: 4, height: 4, background: 'var(--accent)', borderRadius: '50%' }} />
              Added Rego Check
            </div>

            {/* Preview Branch Title */}
            <div style={{
              background: '#ffffff',
              color: '#000000',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ fontSize: 8, opacity: 0.6, border: '1px solid rgba(0,0,0,0.15)', padding: '1px 3px', borderRadius: 2 }}>DRY RUN</span>
              policy-dryrun
            </div>

            {/* Test Passed circle with label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', bottom: '24px', fontSize: 9, color: '#777', whiteSpace: 'nowrap' }}>Simulation Passed</span>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#201a08',
                border: '1.5px solid #FFDA62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={11} color="#FFDA62" strokeWidth={3} />
              </div>
            </div>

            {/* Push to Prod circle with label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', bottom: '24px', fontSize: 9, color: '#777', whiteSpace: 'nowrap' }}>Promote to Enforced</span>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#201a08',
                border: '1.5px solid #FFDA62',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ArrowRight size={11} color="#FFDA62" strokeWidth={3} style={{ transform: 'rotate(-45deg)' }} />
              </div>
            </div>
          </div>

          {/* Lower Branch 1: eval-risk */}
          <svg style={{
            position: 'absolute',
            bottom: 0,
            left: '20%',
            width: '40%',
            height: '50%',
            pointerEvents: 'none',
            zIndex: 2
          }}>
            <path
              d="M 0,0 C 60,75 150,75 200,75 L 350,75"
              fill="none"
              stroke="#ef4444"
              strokeWidth="1.5"
            />
          </svg>

          <div style={{
            position: 'absolute',
            left: '25%',
            bottom: '4%',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {/* Agent call: db_write Pill */}
            <div style={{
              background: '#0c0c0c',
              border: '1px solid #1c1c1c',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: '#f59e0b'
            }}>
              <span style={{ width: 4, height: 4, background: '#f59e0b', borderRadius: '50%' }} />
              Agent call: db_write
            </div>

            {/* Preview Branch */}
            <div style={{
              background: '#ffffff',
              color: '#000000',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ fontSize: 8, opacity: 0.6, border: '1px solid rgba(0,0,0,0.15)', padding: '1px 3px', borderRadius: 2 }}>INTERCEPT</span>
              eval-risk
            </div>

            {/* Test Failed circle with label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '24px', fontSize: 9, color: '#777', whiteSpace: 'nowrap' }}>Risk Score: 0.95</span>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#450a0a',
                border: '1.5px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={11} color="#ef4444" strokeWidth={3} />
              </div>
            </div>

            {/* Close Branch circle with label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '24px', fontSize: 9, color: '#777', whiteSpace: 'nowrap' }}>Access Blocked</span>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#450a0a',
                border: '1.5px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <X size={11} color="#ef4444" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Lower Branch 2: taint-lineage */}
          <svg style={{
            position: 'absolute',
            bottom: 0,
            left: '60%',
            width: '30%',
            height: '50%',
            pointerEvents: 'none',
            zIndex: 2
          }}>
            <path
              d="M 0,0 C 40,75 100,75 150,75"
              fill="none"
              stroke="#222"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />
          </svg>

          <div style={{
            position: 'absolute',
            left: '62%',
            bottom: '4%',
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            {/* Agent call: external_api Pill */}
            <div style={{
              background: '#0c0c0c',
              border: '1px solid #1c1c1c',
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              color: '#38bdf8'
            }}>
              <span style={{ width: 4, height: 4, background: '#38bdf8', borderRadius: '50%' }} />
              Agent call: external_api
            </div>

            {/* Preview Branch */}
            <div style={{
              background: '#ffffff',
              color: '#000000',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{ fontSize: 8, opacity: 0.6, border: '1px solid rgba(0,0,0,0.15)', padding: '1px 3px', borderRadius: 2 }}>LINEAGE</span>
              taint-lineage
            </div>

            {/* Taint indicator with label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '24px', fontSize: 9, color: '#777', whiteSpace: 'nowrap' }}>Redacted Flow</span>
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#0a2f4c',
                border: '1.5px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Check size={11} color="#38bdf8" strokeWidth={3} />
              </div>
            </div>
          </div>

        </div>

        {/* Human Agent Toggle Pill at bottom */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 40
        }}>
          <div style={{
            display: 'inline-flex',
            background: '#0f0f0f',
            border: '1px solid #1c1c1c',
            borderRadius: '20px',
            padding: 2,
          }}>
            <button
              onClick={() => setActiveToggle('human')}
              style={{
                background: activeToggle === 'human' ? 'var(--accent)' : 'transparent',
                color: activeToggle === 'human' ? '#000' : '#777',
                border: 'none',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              HUMAN
            </button>
            <button
              onClick={() => setActiveToggle('agent')}
              style={{
                background: activeToggle === 'agent' ? 'var(--accent)' : 'transparent',
                color: activeToggle === 'agent' ? '#000' : '#777',
                border: 'none',
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              AGENT
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
/* ── 4. TESTIMONIAL SECTION ── */
function TestimonialSection() {
  const ref = useScrollAnimation();

  return (
    <section className="section section-border-top" ref={ref} style={{ background: '#000000', borderBottom: '1px solid #141414' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span className="mono-label" style={{ marginBottom: 12, display: 'block', fontSize: 11 }}>Trusted By Teams</span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 300, color: '#ffffff' }}>What engineers are saying</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {testimonials.map((t) => (
            <div key={t.author} style={{
              border: '1px solid #141414',
              borderRadius: 8,
              padding: '32px 24px',
              background: '#050505',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill="var(--accent)" color="var(--accent)" />
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#b4b4b4', lineHeight: 1.6, flex: 1, margin: 0 }}>
                "{t.quote}"
              </p>
              <div style={{ borderTop: '1px solid #141414', paddingTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ffffff' }}>{t.author}</div>
                <div style={{ fontSize: 11, color: '#777777', fontFamily: 'var(--font-mono)' }}>{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}


/* ── 6. CTA SECTION ── */
function CTASection() {
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <Link to="/signup" style={{
            background: '#ffffff',
            color: '#000000',
            fontWeight: 600,
            fontSize: 15,
            padding: '12px 32px',
            borderRadius: '6px',
            textDecoration: 'none',
          }}>
            Get Started Free
          </Link>
          <Link to="/contact" style={{
            background: 'transparent',
            color: '#ffffff',
            border: '1px solid #ffffff',
            fontWeight: 500,
            fontSize: 15,
            padding: '12px 32px',
            borderRadius: '6px',
            textDecoration: 'none',
          }}>
            Talk to Sales
          </Link>
        </div>
      </div>
    </section>
  );
}
