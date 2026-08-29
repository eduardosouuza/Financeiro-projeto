import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
};

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-5 ${onClick || hover ? 'cursor-pointer' : ''} ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        border: '1px solid var(--border-color)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {children}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'accent' | 'primary';
  subtitle?: string;
};

const toneStyles: Record<string, { bg: string; text: string; iconBg: string }> = {
  default: { bg: 'var(--bg-card)', text: 'var(--text-primary)', iconBg: '#f1f5f9' },
  success: { bg: 'var(--bg-card)', text: '#059669', iconBg: '#d1fae5' },
  danger: { bg: 'var(--bg-card)', text: '#dc2626', iconBg: '#fee2e2' },
  warning: { bg: 'var(--bg-card)', text: '#d97706', iconBg: '#fef3c7' },
  accent: { bg: 'var(--bg-card)', text: '#0284c7', iconBg: '#e0f2fe' },
  primary: { bg: 'var(--bg-card)', text: '#1e3a8a', iconBg: '#dbeafe' },
};

export function StatCard({ label, value, icon, tone = 'default', subtitle }: StatCardProps) {
  const s = toneStyles[tone];
  return (
    <div
      className="rounded-2xl p-5 animate-fade-in"
      style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="mt-1.5 text-xl font-bold truncate" style={{ color: s.text }}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: s.iconBg, color: s.text }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
