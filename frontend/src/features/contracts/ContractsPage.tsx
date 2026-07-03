import { FileText } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function ContractsPage() {
  return (
    <FeaturePage
      title="Optional Task Contracts"
      description="Bind autonomous agent sessions to clear limits and bypass policies with pre-approved contracts."
      icon={<FileText className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Task Contracts Inventory</h3>
        <p className="text-sm text-muted-foreground">List of active task contracts with budget enforcement, write limits, and bypass validation tokens.</p>
      </div>
    </FeaturePage>
  );
}
