import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Wallet, TrendingUp } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Expense } from '@/lib/types';
import { formatCurrency, formatDate, todayISO } from '@/lib/format';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { calcDailyAverage, getExpensesByCategory } from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

export function VariableExpensesPage() {
  const { expenses, accounts, cards, budgets, loading, refresh } = useFinanceData();
  const { user, profile } = useAuth();
  const ownerName = profile?.full_name ?? '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const now = new Date();

  const variable = useMemo(() => expenses.filter((e) => e.type === 'variavel'), [expenses]);
  const monthVariable = useMemo(() => variable.filter((e) => e.due_date && new Date(e.due_date).getMonth() === now.getMonth() && new Date(e.due_date).getFullYear() === now.getFullYear()), [variable, now]);

  const totalMonth = monthVariable.reduce((s, e) => s + (e.paid_amount || e.expected_amount), 0);
  const dailyAvg = calcDailyAverage(monthVariable, now);
  const byCategory = getExpensesByCategory(monthVariable, now);
  const maxExpense = monthVariable.reduce((max, e) => Math.max(max, e.paid_amount || e.expected_amount), 0);
  const topCategory = byCategory[0];

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('expenses').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Gastos Variáveis</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gastos do dia a dia</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Novo gasto
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
        <SummaryBox label="Total no mês" value={formatCurrency(totalMonth)} color="#dc2626" />
        <SummaryBox label="Média diária" value={formatCurrency(dailyAvg)} color="#d97706" />
        <SummaryBox label="Maior gasto" value={formatCurrency(maxExpense)} color="#1e3a8a" />
        <SummaryBox label="Top categoria" value={topCategory?.category ?? '-'} color="#0891b2" />
      </div>

      {/* Budget alerts */}
      {budgets.length > 0 && byCategory.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Orçamentos</h3>
          <div className="space-y-2">
            {budgets.map((b) => {
              const spent = byCategory.find((c) => c.category === b.category)?.amount ?? 0;
              const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
              const tone = pct >= 100 ? '#dc2626' : pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#059669';
              return (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{b.category}</span>
                    <span style={{ color: tone }}>{formatCurrency(spent)} / {formatCurrency(b.monthly_limit)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: tone }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* List */}
      {variable.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet size={28} />}
            title="Nenhum gasto cadastrado"
            description="Registre seus gastos do dia a dia como mercado, combustível e lazer."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Registrar gasto</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {variable.map((e) => (
            <Card key={e.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{e.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {e.category && <Badge>{e.category}</Badge>}
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(e.due_date)}</span>
                    {e.payment_method && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {e.payment_method}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-bold" style={{ color: '#dc2626' }}>{formatCurrency(e.paid_amount || e.expected_amount)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(e); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(e)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <VariableExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        accounts={accounts}
        cards={cards}
        userId={user?.id ?? ''}
        ownerName={ownerName}
        onSaved={() => { setModalOpen(false); refresh(); }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir gasto"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Excluir <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
      <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 text-base font-bold truncate sm:text-lg" style={{ color }}>{value}</p>
    </div>
  );
}

function VariableExpenseFormModal({ open, onClose, editing, accounts, cards, userId, ownerName, onSaved }: {
  open: boolean;
  onClose: () => void;
  editing: Expense | null;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  userId: string;
  ownerName: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '', category: '', expected_amount: '', due_date: todayISO(),
    payment_method: '', account_id: '', card_id: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      name: editing?.name ?? '', category: editing?.category ?? '', expected_amount: editing?.expected_amount?.toString() ?? '',
      due_date: editing?.due_date ?? todayISO(), payment_method: editing?.payment_method ?? '',
      account_id: editing?.account_id ?? '', card_id: editing?.card_id ?? '', notes: editing?.notes ?? '',
    });
  }

  const handleSave = async () => {
    if (!form.name || !form.expected_amount) return;
    setSaving(true);
    const payload = {
      name: form.name, description: '', category: form.category,
      expected_amount: parseFloat(form.expected_amount) || 0, paid_amount: parseFloat(form.expected_amount) || 0,
      due_date: form.due_date, paid_date: form.due_date, payment_method: form.payment_method,
      account_id: form.account_id || null, card_id: form.card_id || null,
      status: 'pago', type: 'variavel', recurring: false, frequency: 'mensal',
      installments_total: 1, installment_current: 1, payment_period: 0, notes: form.notes,
    };
    if (editing) {
      await supabase.from('expenses').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('expenses').insert({ ...payload, user_id: userId, owner_name: ownerName });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar gasto' : 'Novo gasto'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descrição"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Mercado" /></Field>
        <Field label="Categoria">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Selecione</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.expected_amount} onChange={(e) => setForm({ ...form, expected_amount: e.target.value })} /></Field>
        <Field label="Data"><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
        <Field label="Forma de pagamento">
          <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option value="">Selecione</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Conta">
          <Select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value, card_id: '' })}>
            <option value="">Selecione</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Cartão">
          <Select value={form.card_id} onChange={(e) => setForm({ ...form, card_id: e.target.value, account_id: '' })}>
            <option value="">Selecione</option>
            {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}
