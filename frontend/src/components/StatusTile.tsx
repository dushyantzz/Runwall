import { cn } from '@/lib/utils';

interface StatusTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

export function StatusTile({ label, value, icon }: StatusTileProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded border border-[var(--border)] bg-card">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs leading-4 text-muted-foreground">{label}</p>
        <p className="truncate text-base leading-7 text-foreground">{value}</p>
      </div>
    </div>
  );
}
