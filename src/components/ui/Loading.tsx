import { Loader2 } from 'lucide-react';

export function Loading({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={size} className="animate-spin text-primary-700" />
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Loader2 size={40} className="animate-spin text-primary-700" />
    </div>
  );
}
