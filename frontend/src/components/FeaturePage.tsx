import { cn } from '@/lib/utils';

interface FeaturePageProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function FeaturePage({ title, description, icon, children, className }: FeaturePageProps) {
  return (
    <div className={cn('h-full min-h-0 min-w-0 overflow-y-auto bg-semantic-0', className)}>
      <div className="border-b border-[var(--border)] px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-[var(--border)] bg-card text-primary">
            {icon}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        {children}
      </div>
    </div>
  );
}
