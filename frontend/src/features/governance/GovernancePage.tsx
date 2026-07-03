import { Shield } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';
import { Badge } from '@/components/Badge';

export default function GovernancePage() {
  return (
    <FeaturePage
      title="Governance Engine"
      description="Intent-aware execution policies, risk scoring, and policy evaluation pipeline."
      icon={<Shield className="h-5 w-5" />}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded border border-[var(--border)] bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Intent Classification</h3>
          <div className="space-y-2">
            {['read', 'write', 'delete', 'execute', 'admin'].map((cat) => (
              <div key={cat} className="flex items-center justify-between py-1.5 border-b border-[var(--alpha-4)] last:border-0">
                <span className="text-sm text-foreground font-mono">{cat}</span>
                <Badge variant="default">{cat === 'delete' ? 'High Risk' : cat === 'write' ? 'Medium' : 'Low'}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded border border-[var(--border)] bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Risk Score Weights</h3>
          <div className="space-y-3">
            {[
              { label: 'Intent Weight', value: '0.3' },
              { label: 'Tool Sensitivity Weight', value: '0.25' },
              { label: 'Data Classification Weight', value: '0.25' },
              { label: 'Context Weight', value: '0.2' },
            ].map((w) => (
              <div key={w.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{w.label}</span>
                <span className="text-sm font-medium text-foreground font-mono">{w.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
