import { Key } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function APIKeysPage() {
  return (
    <FeaturePage
      title="API Key Management"
      description="Issue, rotate, and monitor API keys. Integrated anomaly detection protects keys from leaks."
      icon={<Key className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Secure Credentials</h3>
        <p className="text-sm text-muted-foreground">Manage cryptographically hashed keys with metadata tagging, rotation policies, and geographic anomaly alerts.</p>
      </div>
    </FeaturePage>
  );
}
