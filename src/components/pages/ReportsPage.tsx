import { useState, useMemo } from 'react';
import { FileBarChart, Download, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useFinanceData } from '@/hooks/useFinanceData';
import { formatCurrency, monthName, formatDate } from '@/lib/format';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import { getMonthlyEvolution, getExpensesByCategory } from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

const PIE_COLORS = ['#1e3a8a', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#475569', '#ea580c'];

export function ReportsPage() {
  const { revenues, expenses, cards, purchases, loans, goals, loading } = useFinanceData();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const refDate = useMemo(() => new Date(year, month, 1), [year, month]);

  const monthRevenues = useMemo(() => revenues.filter((r) => r.received_date && new Date(r.received_date).getMonth() === month && new Date(r.received_date).getFullYear() === year), [revenues, month, year]);
  const monthExpenses = useMemo(() => expenses.filter((e) => e.due_date && new Date(e.due_date).getMonth() === month && new Date(e.due_date).getFullYear() === year), [expenses, month, year]);

  const filteredExpenses = useMemo(() => {
    return monthExpenses.filter((e) => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      return true;
    });
  }, [monthExpenses, statusFilter, categoryFilter]);

  const evolution = useMemo(() => getMonthlyEvolution(revenues, expenses, 12), [revenues, expenses]);
  const byCategory = useMemo(() => getExpensesByCategory(monthExpenses, refDate), [monthExpenses, refDate]);

  const totalRev = monthRevenues.reduce((s, r) => s + r.amount, 0);
  const totalExp = filteredExpenses.reduce((s, e) => s + (e.paid_amount || e.expected_amount), 0);
  const categories = [...new Set(expenses.map((e) => e.category).filter(Boolean))].sort();

  const exportCSV = () => {
    const rows = [
      ['Tipo', 'Descrição', 'Categoria', 'Valor', 'Data', 'Status'],
      ...monthRevenues.map((r) => ['Receita', r.description, r.category, r.amount, r.received_date ?? '', r.received ? 'Recebido' : 'Pendente']),
      ...filteredExpenses.map((e) => ['Despesa', e.name, e.category, e.expected_amount, e.due_date ?? '', e.status]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${monthName(month)}_${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Relatórios</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Análise detalhada das finanças</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="shrink-0"><Download size={16} /> <span className="hidden sm:inline">Exportar CSV</span></Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Mês</label>
            <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i).map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ano</label>
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">Todos</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        <SummaryBox label="Receitas" value={formatCurrency(totalRev)} color="#059669" icon={<TrendingUp size={18} />} />
        <SummaryBox label="Despesas" value={formatCurrency(totalExp)} color="#dc2626" icon={<TrendingDown size={18} />} />
        <SummaryBox label="Saldo" value={formatCurrency(totalRev - totalExp)} color={totalRev - totalExp >= 0 ? '#059669' : '#dc2626'} icon={<Wallet size={18} />} />
        <SummaryBox label="Itens" value={String(filteredExpenses.length + monthRevenues.length)} color="#1e3a8a" icon={<FileBarChart size={18} />} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold sm:mb-4" style={{ color: 'var(--text-primary)' }}>Evolução 12 meses</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#059669" strokeWidth={2} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#dc2626" strokeWidth={2} />
              <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#1e3a8a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-bold sm:mb-4" style={{ color: 'var(--text-primary)' }}>Gastos por categoria</h3>
          {byCategory.length === 0 ? (
            <EmptyState title="Sem dados" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={70} label={(e: any) => e.category ?? ''}>
                  {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Monthly bar */}
      <Card className="min-w-0 overflow-hidden p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-bold sm:mb-4" style={{ color: 'var(--text-primary)' }}>Receitas vs Despesas por mês</h3>
        <ResponsiveContainer width="100%" height={200}>
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
      </Card>

      {/* Detailed list */}
      <Card className="p-4 sm:p-5">
        <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Movimentações detalhadas</h3>
        {filteredExpenses.length === 0 && monthRevenues.length === 0 ? (
          <EmptyState title="Sem movimentações" description="Nenhum registro para os filtros selecionados." />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {monthRevenues.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex min-w-0 items-center gap-2">
                  <TrendingUp size={16} className="text-success-600" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{r.description}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.category} · {formatDate(r.received_date)}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-success-600">{formatCurrency(r.amount)}</span>
              </div>
            ))}
            {filteredExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex min-w-0 items-center gap-2">
                  <TrendingDown size={16} className="text-danger-600" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{e.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.category} · {formatDate(e.due_date)}</span>
                      <Badge tone={STATUS_COLORS[e.status] as 'success'}>{STATUS_LABELS[e.status]}</Badge>
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-danger-600">{formatCurrency(e.paid_amount || e.expected_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="truncate text-base font-bold sm:text-lg" style={{ color }}>{value}</p>
    </div>
  );
}
