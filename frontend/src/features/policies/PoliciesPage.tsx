import { FileCode } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function PoliciesPage() {
  return (
    <FeaturePage
      title="OPA Policies"
      description="Manage versioned Rego policy bundles, staged rollouts, and simulation parameters."
      icon={<FileCode className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Rego Policy Bundles</h3>
        <p className="text-sm text-muted-foreground">Monitor and deploy versioned declarative OPA policy bundles. Control rollout percentages and dry-run simulation mode settings.</p>
      </div>
    </FeaturePage>
  );
}
