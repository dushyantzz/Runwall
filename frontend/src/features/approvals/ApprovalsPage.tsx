import { CheckSquare } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function ApprovalsPage() {
  return (
    <FeaturePage
      title="Approvals Workflow Engine"
      description="Manage approval queues, escalate high-risk tool execution, and review requests."
      icon={<CheckSquare className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Pending Interceptions</h3>
        <p className="text-sm text-muted-foreground">List of intercepted actions awaiting human verification before continuation. Enforces policy requirements.</p>
      </div>
    </FeaturePage>
  );
}
