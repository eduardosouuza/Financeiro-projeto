import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        {icon ?? <Inbox size={28} />}
      </div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm" style={{ color: 'var(--text-muted)' }}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
