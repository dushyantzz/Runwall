import { Shield, Activity, CheckCircle, AlertTriangle, Scale, FileText, Clock } from 'lucide-react';
import { MetricCard } from '@/components/MetricCard';
import { StatusTile } from '@/components/StatusTile';
import { Badge } from '@/components/Badge';

export default function DashboardPage() {
  return (
    <main className="h-full min-h-0 min-w-0 overflow-y-auto bg-semantic-0">
      <div className="flex min-w-0 flex-col lg:flex-row">
        {/* Left Panel - Stats */}
        <section className="w-auto lg:w-[480px] min-w-0 shrink-0 border-b border-[var(--border)] px-10 py-10 lg:border-r lg:border-b-0 lg:h-full lg:overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[400px] flex-col gap-12">
            <div className="flex flex-col gap-12">
              <div className="flex items-center gap-2">
                <h1 className="text-[32px] font-medium leading-8 text-foreground">Governance Platform</h1>
                <Badge variant="success" className="h-5 rounded px-2 py-0 text-xs font-medium uppercase">
                  ACTIVE
                </Badge>
              </div>

              <div className="flex gap-6">
                <StatusTile
                  label="Status"
                  value="Healthy"
                  icon={<div className="h-2 w-2 rounded-full bg-primary" />}
                />
                <StatusTile
                  label="Policy Engine"
                  value="OPA / Rego"
                  icon={<CheckCircle className="h-5 w-5 text-primary" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Active Policies"
                value="12"
                icon={<Shield className="h-4 w-4" />}
              />
              <MetricCard
                label="Pending Approvals"
                value="3"
                icon={<Clock className="h-4 w-4" />}
              />
              <MetricCard
                label="Risk Events (24h)"
                value="47"
                icon={<AlertTriangle className="h-4 w-4" />}
              />
              <MetricCard
                label="Quota Usage"
                value="68"
                unit="%"
                icon={<Scale className="h-4 w-4" />}
              />
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-normal leading-7 text-foreground">Recent Activity</h2>
              <div className="flex flex-col gap-2">
                {[
                  { action: 'Policy DENY', tool: 'sql_execute', time: '2m ago', variant: 'destructive' as const },
                  { action: 'Approval Granted', tool: 'http_post', time: '15m ago', variant: 'success' as const },
                  { action: 'Taint Detected', tool: 'run_command', time: '1h ago', variant: 'warning' as const },
                  { action: 'Tool Registered', tool: 'data_export', time: '3h ago', variant: 'info' as const },
                ].map((event, i) => (
                  <div key={i} className="flex items-center gap-3 rounded border border-[var(--border)] bg-card px-3 py-2">
                    <Badge variant={event.variant}>{event.action}</Badge>
                    <span className="text-sm text-foreground flex-1 truncate font-mono">{event.tool}</span>
                    <span className="text-xs text-muted-foreground">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel - Architecture Visualizer */}
        <section className="relative min-h-[420px] min-w-0 flex-1 overflow-hidden bg-semantic-0 lg:min-h-0">
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.12) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />
          <div
            className="absolute inset-0 hidden dark:block"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.10) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
            }}
          />

          <div className="relative z-10 flex h-full items-center justify-center p-8">
            <div className="flex flex-col items-center gap-8 max-w-xl">
              {/* Flow Visualization */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                {[
                  { label: 'Agent Request', icon: Activity },
                  { label: 'Intent Classifier', icon: Shield },
                  { label: 'Risk Scorer', icon: AlertTriangle },
                  { label: 'OPA Policy', icon: FileText },
                  { label: 'Execution', icon: CheckCircle },
                ].map((step, i, arr) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-[100px] h-[80px] rounded-lg border border-[var(--border)] bg-card shadow-[0px_4px_4px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-1.5 p-2">
                        <step.icon className="h-5 w-5 text-primary" />
                        <span className="text-[11px] leading-tight text-center text-muted-foreground font-medium">{step.label}</span>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-6 h-px bg-primary hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground text-center max-w-md">
                Every AI agent tool call passes through the governance pipeline: Intent Classification → Risk Scoring → OPA Policy Evaluation → Secure Execution.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
