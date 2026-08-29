import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { calcMonthFinance } from '@/lib/calculations';
import { formatCurrency, monthName } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

export function PlanningPage() {
  const { revenues, expenses, goals, loading } = useFinanceData();
  const [refDate, setRefDate] = useState(new Date());

  const finance = useMemo(() => calcMonthFinance(revenues, expenses, goals, refDate), [revenues, expenses, goals, refDate]);

  const years = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Planejamento</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Acompanhe seus meses</p>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1))} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-36 text-center text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{monthName(refDate.getMonth())} {refDate.getFullYear()}</span>
          <button onClick={() => setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1))} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight size={20} />
          </button>
        </div>
        <select
          value={refDate.getFullYear()}
          onChange={(e) => setRefDate(new Date(Number(e.target.value), refDate.getMonth(), 1))}
          className="rounded-xl border px-3 py-2 text-sm"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Month cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        <PlanCard label="Receita prevista" value={formatCurrency(finance.totalRevenue)} color="#059669" />
        <PlanCard label="Receita recebida" value={formatCurrency(finance.receivedRevenue)} color="#10b981" />
        <PlanCard label="Despesas previstas" value={formatCurrency(finance.totalExpenses)} color="#dc2626" />
        <PlanCard label="Despesas pagas" value={formatCurrency(finance.paidExpenses)} color="#ef4444" />
        <PlanCard label="Gastos variáveis" value={formatCurrency(finance.variableExpenses)} color="#d97706" />
        <PlanCard label="Saldo previsto" value={formatCurrency(finance.projectedBalance)} color={finance.projectedBalance >= 0 ? '#0891b2' : '#dc2626'} />
        <PlanCard label="Saldo real" value={formatCurrency(finance.balance)} color={finance.balance >= 0 ? '#059669' : '#dc2626'} />
        <PlanCard label="Economizado" value={formatCurrency(finance.totalSaved)} color="#1e3a8a" />
      </div>

      {/* Committed percent */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Renda comprometida</p>
          <span className="text-sm font-bold" style={{ color: finance.committedPercent > 90 ? '#dc2626' : finance.committedPercent > 70 ? '#d97706' : '#059669' }}>
            {finance.committedPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, finance.committedPercent)}%`, backgroundColor: finance.committedPercent > 90 ? '#dc2626' : finance.committedPercent > 70 ? '#d97706' : '#059669' }} />
        </div>
      </Card>

      {/* Month selector grid */}
      <Card>
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Navegar entre meses</h3>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 sm:grid-cols-4">
          {Array.from({ length: 12 }, (_, i) => i).map((m) => (
            <button
              key={m}
              onClick={() => setRefDate(new Date(refDate.getFullYear(), m, 1))}
              className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                m === refDate.getMonth() ? 'bg-primary-800 text-white' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
              }`}
            >
              {monthName(m)}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function PlanCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
      <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 text-base font-bold truncate sm:text-lg" style={{ color }}>{value}</p>
    </div>
  );
}
