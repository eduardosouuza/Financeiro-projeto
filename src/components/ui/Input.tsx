import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

type FieldProps = {
  label?: string;
  error?: string;
  children: ReactNode;
  hint?: string;
};

export function Field({ label, error, children, hint }: FieldProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}

const inputBase = 'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-primary-500/30';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${inputBase} ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${inputBase} ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`${inputBase} resize-none ${className}`}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
      }}
      {...props}
    />
  );
}
