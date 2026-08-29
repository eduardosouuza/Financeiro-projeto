import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
};

const variants: Record<string, string> = {
  primary: 'bg-primary-800 text-white hover:bg-primary-700',
  secondary: 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-600',
  ghost: 'bg-transparent text-primary-800 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-neutral-800',
  danger: 'bg-danger-600 text-white hover:bg-danger-700',
  success: 'bg-success-600 text-white hover:bg-success-700',
  outline: 'bg-transparent border border-primary-800 text-primary-800 hover:bg-primary-50 dark:border-primary-400 dark:text-primary-300 dark:hover:bg-neutral-800',
};

const sizes: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', children, fullWidth, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
