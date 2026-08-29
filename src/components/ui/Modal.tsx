import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const sizeClasses: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-slide-up sm:animate-fade-in`}
        style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-elevated)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t px-5 py-4" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
