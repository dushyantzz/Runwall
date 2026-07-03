import { Lock } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function IdentityPage() {
  return (
    <FeaturePage
      title="Identity & Session Management"
      description="Manage tenants, user identities, roles, permissions, and active sessions."
      icon={<Lock className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Enterprise Users & Service Accounts</h3>
        <p className="text-sm text-muted-foreground">Configuration panel for multi-tenant mapping, service account credentials, and context-bound roles.</p>
      </div>
    </FeaturePage>
  );
}
