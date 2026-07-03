import { ScrollText } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function AuditPage() {
  return (
    <FeaturePage
      title="Audit Explorer"
      description="Trace historical execution details, session lifecycles, and performance metrics."
      icon={<ScrollText className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Audit History</h3>
        <p className="text-sm text-muted-foreground">Search and filter detailed audit logs captured during execution interception, including security classification decisions.</p>
      </div>
    </FeaturePage>
  );
}
