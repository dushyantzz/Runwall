import React, { useState } from 'react';
import { Table, LineChart } from 'lucide-react';
import type { DashboardTimeseries, TimeseriesPoint } from '@/types/dashboard';

interface DashboardTimelineChartProps {
  timeseries: DashboardTimeseries | null;
  loading: boolean;
}

export const DashboardTimelineChart: React.FC<DashboardTimelineChartProps> = ({ timeseries, loading }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ point: TimeseriesPoint; x: number; y: number } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const points = timeseries?.points || [];

  if (loading) {
    return (
      <div style={{
        background: 'var(--card-bg, #141414)',
        border: '1px solid var(--border, #262626)',
        borderRadius: '10px',
        padding: '24px',
        marginBottom: 24,
        height: '300px',
        animation: 'pulse 1.5s infinite ease-in-out',
      }} />
    );
  }

  // Calculate scales
  const maxVal = Math.max(
    5,
    ...points.map(p => Math.max(p.allowed, p.blocked, p.approvals))
  );

  const width = 800;
  const height = 220;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (points.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  // Build SVG path strings
  const buildLinePath = (getter: (p: TimeseriesPoint) => number) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => {
      const x = getX(i);
      const y = getY(getter(p));
      return i === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  };

  const buildAreaPath = (getter: (p: TimeseriesPoint) => number) => {
    if (points.length === 0) return '';
    const line = buildLinePath(getter);
    const startX = getX(0);
    const endX = getX(points.length - 1);
    const baseY = getY(0);
    return `${line} L ${endX},${baseY} L ${startX},${baseY} Z`;
  };

  const allowedLine = buildLinePath(p => p.allowed);
  const allowedArea = buildAreaPath(p => p.allowed);

  const blockedLine = buildLinePath(p => p.blocked);
  const blockedArea = buildAreaPath(p => p.blocked);

  const formatBucketTime = (iso: string) => {
    try {
      const d = new Date(iso);
      if (timeseries?.bucket === '1d') {
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return iso;
    }
  };

  return (
    <div style={{
      background: 'var(--card-bg, #141414)',
      border: '1px solid var(--border, #262626)',
      borderRadius: '10px',
      padding: '20px 24px',
      marginBottom: 24,
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '17px',
              fontWeight: 600,
              color: 'var(--heading, #ffffff)',
              margin: 0,
            }}>
              Traffic & Threat Mitigation Activity
            </h2>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--muted, #9ca3af)' }}>
            Zero-filled timeline comparison of blocked threats vs allowed executions
          </span>
        </div>

        {/* Legend & Table Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent, #FFDA62)' }} />
              <span style={{ color: 'var(--body, #b4b4b4)' }}>Allowed</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ color: 'var(--body, #b4b4b4)' }}>Blocked</span>
            </div>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            aria-label={showTable ? 'Switch to timeline chart view' : 'Switch to accessible data table view'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid var(--border, #262626)',
              borderRadius: '6px',
              padding: '5px 10px',
              fontSize: '12px',
              color: 'var(--muted, #9ca3af)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'var(--border-bright, #333333)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted, #9ca3af)';
              e.currentTarget.style.borderColor = 'var(--border, #262626)';
            }}
          >
            {showTable ? <LineChart size={13} /> : <Table size={13} />}
            <span>{showTable ? 'Chart View' : 'Table View'}</span>
          </button>
        </div>
      </div>

      {showTable ? (
        /* Accessible Table Alternative */
        <div style={{ overflowX: 'auto', maxHeight: '280px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
            aria-label="Activity timeline data table"
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border, #262626)', color: 'var(--muted, #9ca3af)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Timestamp</th>
                <th style={{ padding: '8px 12px' }}>Allowed Safe</th>
                <th style={{ padding: '8px 12px' }}>Blocked Threats</th>
                <th style={{ padding: '8px 12px' }}>Required Approvals</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1a1a1a', color: 'var(--body, #b4b4b4)' }}>
                  <td style={{ padding: '8px 12px' }}>{new Date(p.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--accent, #FFDA62)' }}>{p.allowed}</td>
                  <td style={{ padding: '8px 12px', color: '#ef4444' }}>{p.blocked}</td>
                  <td style={{ padding: '8px 12px', color: '#f59e0b' }}>{p.approvals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* SVG Interactive Chart */
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', minWidth: '600px', display: 'block' }}
            role="img"
            aria-label="Timeline graph showing blocked threats in red and allowed requests in gold"
          >
            <defs>
              <linearGradient id="allowedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFDA62" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FFDA62" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines (horizontal) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartHeight * ratio;
              const val = Math.round(maxVal * (1 - ratio));
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#1f1f1f"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    fill="#666666"
                    fontSize="10"
                    textAnchor="end"
                    fontFamily="var(--font-mono, monospace)"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area fills */}
            {allowedArea && <path d={allowedArea} fill="url(#allowedGrad)" />}
            {blockedArea && <path d={blockedArea} fill="url(#blockedGrad)" />}

            {/* Line curves */}
            {allowedLine && (
              <path
                d={allowedLine}
                fill="none"
                stroke="var(--accent, #FFDA62)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {blockedLine && (
              <path
                d={blockedLine}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* X-axis labels */}
            {points.map((p, i) => {
              // Show label every few points to avoid crowding
              const step = Math.ceil(points.length / 6);
              if (i % step !== 0 && i !== points.length - 1) return null;
              const x = getX(i);
              return (
                <text
                  key={i}
                  x={x}
                  y={height - 8}
                  fill="#777777"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-mono, monospace)"
                >
                  {formatBucketTime(p.timestamp)}
                </text>
              );
            })}

            {/* Interactive hover points */}
            {points.map((p, i) => {
              const x = getX(i);
              const yAllowed = getY(p.allowed);
              const yBlocked = getY(p.blocked);

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredPoint({ point: p, x, y: Math.min(yAllowed, yBlocked) })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Invisible hit column */}
                  <rect
                    x={x - (chartWidth / points.length) / 2}
                    y={paddingTop}
                    width={chartWidth / points.length}
                    height={chartHeight}
                    fill="transparent"
                  />
                  {/* Circle indicators */}
                  {hoveredPoint?.point.timestamp === p.timestamp && (
                    <>
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartHeight}
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeDasharray="2 2"
                      />
                      <circle cx={x} cy={yAllowed} r="4" fill="var(--accent, #FFDA62)" />
                      <circle cx={x} cy={yBlocked} r="4" fill="#ef4444" />
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Floating Tooltip */}
          {hoveredPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${Math.min(width - 160, Math.max(30, hoveredPoint.x - 60))}px`,
                top: `${hoveredPoint.y - 70 > 10 ? hoveredPoint.y - 70 : 60}px`,
                background: '#1c1c1c',
                border: '1px solid var(--border-bright, #333333)',
                borderRadius: '6px',
                padding: '8px 12px',
                pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                zIndex: 20,
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}>
                {new Date(hoveredPoint.point.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent, #FFDA62)' }}>
                <span>Allowed:</span>
                <span style={{ fontWeight: 700 }}>{hoveredPoint.point.allowed}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444' }}>
                <span>Blocked:</span>
                <span style={{ fontWeight: 700 }}>{hoveredPoint.point.blocked}</span>
              </div>
              {hoveredPoint.point.approvals > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                  <span>Approvals:</span>
                  <span style={{ fontWeight: 700 }}>{hoveredPoint.point.approvals}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardTimelineChart;
