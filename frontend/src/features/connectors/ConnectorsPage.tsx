import { Plug } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function ConnectorsPage() {
  return (
    <FeaturePage
      title="Connector Inventory"
      description="Register, modify, and monitor dynamic REST API, Database, and Shell adapters."
      icon={<Plug className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Systems Integrations</h3>
        <p className="text-sm text-muted-foreground">List of active adapters injecting tools dynamically into the core registry under secure sandbox boundaries.</p>
      </div>
    </FeaturePage>
  );
}
