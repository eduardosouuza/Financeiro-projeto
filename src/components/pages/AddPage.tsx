import { useState } from 'react';
import { Plus, TrendingUp, Receipt, Wallet, CreditCard, Landmark, Target, X } from 'lucide-react';
import { useRouter } from '@/contexts/RouterContext';

export function AddPage() {
  const { navigate } = useRouter();

  const options = [
    { route: 'revenues', label: 'Receita', icon: <TrendingUp size={24} />, color: '#059669' },
    { route: 'expenses', label: 'Conta fixa', icon: <Receipt size={24} />, color: '#dc2626' },
    { route: 'variable', label: 'Gasto variável', icon: <Wallet size={24} />, color: '#d97706' },
    { route: 'cards', label: 'Cartão', icon: <CreditCard size={24} />, color: '#1e3a8a' },
    { route: 'installments', label: 'Compra parcelada', icon: <Plus size={24} />, color: '#0891b2' },
    { route: 'loans', label: 'Empréstimo', icon: <Landmark size={24} />, color: '#7c3aed' },
    { route: 'goals', label: 'Meta', icon: <Target size={24} />, color: '#db2777' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Adicionar</h1>
        <button onClick={() => navigate('dashboard')} style={{ color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {options.map((o) => (
          <button
            key={o.route}
            onClick={() => navigate(o.route)}
            className="flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:scale-105 hover:shadow-lg sm:gap-3 sm:p-6"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl sm:h-14 sm:w-14" style={{ backgroundColor: o.color + '20', color: o.color }}>
              {o.icon}
            </div>
            <span className="text-center text-xs font-medium sm:text-sm" style={{ color: 'var(--text-primary)' }}>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
