import { Scale } from 'lucide-react';
import { FeaturePage } from '@/components/FeaturePage';

export default function QuotasPage() {
  return (
    <FeaturePage
      title="Distributed Quotas & Rate Limits"
      description="Define usage budgets and protect downstream services from rate limit exhaustion."
      icon={<Scale className="h-5 w-5" />}
    >
      <div className="rounded border border-[var(--border)] bg-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Rate Limiting & Budgets</h3>
        <p className="text-sm text-muted-foreground">Monitor dynamic rate limits per user, tenant, and tool. Restrict external API spends before budgets are exceeded.</p>
      </div>
    </FeaturePage>
  );
}
