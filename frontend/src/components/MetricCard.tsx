import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, unit, icon, className }: MetricCardProps) {
  return (
    <div className={cn('flex h-[120px] min-h-[120px] flex-col justify-between rounded border border-[var(--border)] bg-card p-4', className)}>
      <div className="flex h-[22px] items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center text-muted-foreground">{icon}</div>
        <p className="truncate text-[13px] leading-[22px] text-muted-foreground">{label}</p>
      </div>
      <p className="text-[20px] font-medium leading-7 text-foreground">
        {value}
        {unit && <span className="ml-1 text-xs font-normal leading-4 text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
