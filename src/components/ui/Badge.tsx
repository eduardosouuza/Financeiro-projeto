import type { ReactNode } from 'react';

type BadgeProps = {
  children: ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning' | 'accent' | 'primary';
  size?: 'sm' | 'md';
};

const tones: Record<string, string> = {
  default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  success: 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300',
  danger: 'bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300',
};

export function Badge({ children, tone = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${tones[tone]} ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
      {children}
    </span>
  );
}
