import { AlertTriangle } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function RiskPage() {
  return (
    <FeaturePage
      title="Risk Scorer & Taint Tracking"
      description="Trace sensitive data flow and analyze execution risk vectors in real-time."
      icon={<AlertTriangle className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Taint Tracking & Blast Radius Control</h3>
        <p className="text-sm text-muted-foreground">Monitor input/output payloads for taints (e.g. pii, high_risk) to automatically prevent downstream data exfiltration.</p>
      </div>
    </FeaturePage>
  );
}
