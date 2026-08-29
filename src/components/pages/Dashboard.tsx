import { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, CheckCircle2, Clock, Scale,
  PiggyBank, Target, AlertTriangle, CalendarClock, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useCouple } from '@/contexts/CoupleContext';
import { calcMonthFinance, getExpensesByCategory, getMonthlyEvolution, getProjected12Months } from '@/lib/calculations';
import { formatCurrency, formatDate, daysUntil, monthName } from '@/lib/format';
import { StatCard } from '@/components/ui/Card';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from '@/contexts/RouterContext';

const PIE_COLORS = ['#1e3a8a', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#475569', '#ea580c'];

export function Dashboard() {
  const { revenues, expenses, goals, loans, loading } = useFinanceData();
  const { couple } = useCouple();
  const { navigate } = useRouter();
  const now = new Date();
  const showOwner = couple?.status === 'active';

  const finance = useMemo(() => calcMonthFinance(revenues, expenses, goals, now), [revenues, expenses, goals]);
  const byCategory = useMemo(() => getExpensesByCategory(expenses, now), [expenses]);
  const evolution = useMemo(() => getMonthlyEvolution(revenues, expenses, 6), [revenues, expenses]);
  const projection = useMemo(() => getProjected12Months(revenues, expenses, loans, goals), [revenues, expenses, loans, goals]);

  const upcoming = useMemo(() =>
    expenses
      .filter((e) => e.due_date && (e.status === 'pendente' || e.status === 'parcialmente_pago'))
      .map((e) => ({ ...e, days: daysUntil(e.due_date) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 5),
    [expenses]);

  const overdue = useMemo(() =>
    expenses.filter((e) => e.status === 'atrasado'),
    [expenses]);

  const activeGoals = useMemo(() => goals.filter((g) => g.saved_amount < g.target_amount).slice(0, 3), [goals]);

  const period5 = useMemo(() => {
    const rev = revenues.filter((r) => r.payment_period === 5).reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter((e) => e.payment_period === 5);
    const totalExp = exp.reduce((s, e) => s + e.expected_amount, 0);
    const paid = exp.filter((e) => e.status === 'pago').reduce((s, e) => s + e.paid_amount, 0);
    return { revenue: rev, totalExp, paid, pending: totalExp - paid, balance: rev - totalExp };
  }, [revenues, expenses]);

  const period15 = useMemo(() => {
    const rev = revenues.filter((r) => r.payment_period === 15).reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter((e) => e.payment_period === 15);
    const totalExp = exp.reduce((s, e) => s + e.expected_amount, 0);
    const paid = exp.filter((e) => e.status === 'pago').reduce((s, e) => s + e.paid_amount, 0);
    return { revenue: rev, totalExp, paid, pending: totalExp - paid, balance: rev - totalExp };
  }, [revenues, expenses]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
          {monthName(now.getMonth())} {now.getFullYear()}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Visão geral das suas finanças</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Receita do mês" value={formatCurrency(finance.totalRevenue)} tone="success" icon={<TrendingUp size={20} />} />
        <StatCard label="Total de contas" value={formatCurrency(finance.totalExpenses)} tone="danger" icon={<TrendingDown size={20} />} />
        <StatCard label="Gastos variáveis" value={formatCurrency(finance.variableExpenses)} tone="warning" icon={<Wallet size={20} />} />
        <StatCard label="Já pago" value={formatCurrency(finance.paidExpenses)} tone="success" icon={<CheckCircle2 size={20} />} />
        <StatCard label="Pendente" value={formatCurrency(finance.pendingExpenses)} tone="warning" icon={<Clock size={20} />} />
        <StatCard label="Saldo atual" value={formatCurrency(finance.balance)} tone={finance.balance >= 0 ? 'success' : 'danger'} icon={<Scale size={20} />} />
        <StatCard label="Saldo previsto" value={formatCurrency(finance.projectedBalance)} tone={finance.projectedBalance >= 0 ? 'accent' : 'danger'} icon={<CalendarClock size={20} />} />
        <StatCard label="Total economizado" value={formatCurrency(finance.totalSaved)} tone="primary" icon={<PiggyBank size={20} />} />
      </div>

      {/* Committed percent bar */}
      <Card className="p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Renda comprometida</p>
          <span className="text-sm font-bold" style={{ color: finance.committedPercent > 90 ? '#dc2626' : finance.committedPercent > 70 ? '#d97706' : '#059669' }}>
            {finance.committedPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, finance.committedPercent)}%`,
              backgroundColor: finance.committedPercent > 90 ? '#dc2626' : finance.committedPercent > 70 ? '#d97706' : '#059669',
            }}
          />
        </div>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold sm:mb-4 sm:text-base" style={{ color: 'var(--text-primary)' }}>Receitas e despesas</h3>
          {evolution.length === 0 || evolution.every((e) => e.receitas === 0 && e.despesas === 0) ? (
            <EmptyState title="Sem dados" description="Cadastre receitas e contas para ver os gráficos." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={evolution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#059669" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold sm:mb-4 sm:text-base" style={{ color: 'var(--text-primary)' }}>Gastos por categoria</h3>
          {byCategory.length === 0 ? (
            <EmptyState title="Sem gastos" description="Cadastre contas para ver a distribuição." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.category ?? ''}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Balance evolution + projection */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold sm:mb-4 sm:text-base" style={{ color: 'var(--text-primary)' }}>Evolução do saldo</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold sm:mb-4 sm:text-base" style={{ color: 'var(--text-primary)' }}>Projeção 12 meses</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
              <Line type="monotone" dataKey="saldo" name="Saldo projetado" stroke="#0891b2" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Payment periods */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PeriodCard title="Resumo do dia 5" data={period5} onClick={() => navigate('expenses')} />
        <PeriodCard title="Resumo do dia 15" data={period15} onClick={() => navigate('expenses')} />
      </div>

      {/* Upcoming + overdue */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Próximas contas</h3>
            <button onClick={() => navigate('expenses')} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
              Ver todas <ArrowRight size={14} />
            </button>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState title="Tudo em dia" description="Nenhuma conta pendente." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Vence {formatDate(e.due_date)}</p>
                      {showOwner && e.owner_name && <span className="text-xs font-medium text-primary-600">· {e.owner_name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(e.expected_amount)}</p>
                    {e.days <= 3 && e.days >= 0 && <Badge tone="warning">Em {e.days}d</Badge>}
                    {e.days < 0 && <Badge tone="danger">Atrasada</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Contas atrasadas</h3>
            {overdue.length > 0 && <Badge tone="danger">{overdue.length} conta(s)</Badge>}
          </div>
          {overdue.length === 0 ? (
            <EmptyState title="Nenhuma atrasada" description="Você está em dia com seus pagamentos." />
          ) : (
            <div className="space-y-2">
              {overdue.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-danger-200 bg-danger-50 p-3 dark:border-danger-900/40 dark:bg-danger-900/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-danger-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Venceu {formatDate(e.due_date)}</p>
                        {showOwner && e.owner_name && <span className="text-xs font-medium text-primary-600">· {e.owner_name}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-danger-600">{formatCurrency(e.expected_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Goals */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Metas em andamento</h3>
          <button onClick={() => navigate('goals')} className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:underline">
            Ver todas <ArrowRight size={14} />
          </button>
        </div>
        {activeGoals.length === 0 ? (
          <EmptyState icon={<Target size={28} />} title="Sem metas" description="Crie metas para acompanhar seus objetivos." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {activeGoals.map((g) => {
              const pct = g.target_amount > 0 ? (g.saved_amount / g.target_amount) * 100 : 0;
              return (
                <div key={g.id} className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(g.saved_amount)} / {formatCurrency(g.target_amount)}</p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className="h-full rounded-full bg-primary-700 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <p className="mt-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}% concluído</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function PeriodCard({ title, data, onClick }: { title: string; data: { revenue: number; totalExp: number; paid: number; pending: number; balance: number }; onClick: () => void }) {
  const negative = data.balance < 0;
  return (
    <Card onClick={onClick} hover>
      <h3 className="mb-3 text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <div className="space-y-2">
        <Row label="Salário" value={formatCurrency(data.revenue)} />
        <Row label="Contas" value={formatCurrency(data.totalExp)} />
        <Row label="Pago" value={formatCurrency(data.paid)} positive />
        <Row label="Pendente" value={formatCurrency(data.pending)} warning={data.pending > 0} />
        <div className="border-t pt-2" style={{ borderColor: 'var(--border-color)' }}>
          <Row label={negative ? 'Faltará' : 'Sobrar'} value={formatCurrency(Math.abs(data.balance))} negative={negative} positive={!negative} bold />
        </div>
      </div>
      {negative && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-danger-50 px-3 py-2 text-xs text-danger-700 dark:bg-danger-900/20 dark:text-danger-300">
          <AlertTriangle size={14} />
          As contas ultrapassam o salário disponível.
        </div>
      )}
    </Card>
  );
}

function Row({ label, value, positive, negative, warning, bold }: { label: string; value: string; positive?: boolean; negative?: boolean; warning?: boolean; bold?: boolean }) {
  const color = positive ? '#059669' : negative ? '#dc2626' : warning ? '#d97706' : 'var(--text-primary)';
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="truncate text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'}`} style={{ color }}>{value}</span>
    </div>
  );
}
