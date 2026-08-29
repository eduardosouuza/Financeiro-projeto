import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Clock, AlertTriangle, Receipt } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { useCouple } from '@/contexts/CoupleContext';
import { supabase } from '@/lib/supabase';
import type { Expense } from '@/lib/types';
import { formatCurrency, formatDate, todayISO, daysUntil } from '@/lib/format';
import { FIXED_BILL_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

type Tab = 'all' | '5' | '15' | 'overdue' | 'variable';

export function ExpensesPage() {
  const { expenses, accounts, cards, loading, refresh } = useFinanceData();
  const { user, profile } = useAuth();
  const { couple } = useCouple();
  const showOwner = couple?.status === 'active';
  const [tab, setTab] = useState<Tab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Expense | null>(null);
  const [isVariable, setIsVariable] = useState(false);

  const filtered = useMemo(() => {
    if (tab === '5') return expenses.filter((e) => e.payment_period === 5 && e.type !== 'variavel');
    if (tab === '15') return expenses.filter((e) => e.payment_period === 15 && e.type !== 'variavel');
    if (tab === 'overdue') return expenses.filter((e) => e.status === 'atrasado');
    if (tab === 'variable') return expenses.filter((e) => e.type === 'variavel');
    return expenses;
  }, [expenses, tab]);

  const periodSummary = (period: number) => {
    const exp = expenses.filter((e) => e.payment_period === period && e.type !== 'variavel');
    const total = exp.reduce((s, e) => s + e.expected_amount, 0);
    const paid = exp.filter((e) => e.status === 'pago').reduce((s, e) => s + e.paid_amount, 0);
    return { total, paid, pending: total - paid };
  };

  const p5 = periodSummary(5);
  const p15 = periodSummary(15);

  const markAsPaid = async (exp: Expense) => {
    const newStatus = exp.status === 'pago' ? 'pendente' : 'pago';
    await supabase.from('expenses').update({
      status: newStatus,
      paid_amount: newStatus === 'pago' ? exp.expected_amount : 0,
      paid_date: newStatus === 'pago' ? todayISO() : null,
    }).eq('id', exp.id);
    refresh();
  };

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
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Contas e Despesas</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerencie suas contas fixas e variáveis</p>
        </div>
        <Button onClick={() => { setEditing(null); setIsVariable(false); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Nova conta
        </Button>
      </div>

      {/* Period summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <PeriodSummaryCard title="Período do dia 5" summary={p5} onClick={() => setTab('5')} active={tab === '5'} />
        <PeriodSummaryCard title="Período do dia 15" summary={p15} onClick={() => setTab('15')} active={tab === '15'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([
          { key: 'all', label: 'Todas' },
          { key: '5', label: 'Dia 5' },
          { key: '15', label: 'Dia 15' },
          { key: 'variable', label: 'Variáveis' },
          { key: 'overdue', label: 'Atrasadas' },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-primary-800 text-white'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Receipt size={28} />}
            title="Nenhuma conta encontrada"
            description="Cadastre suas contas fixas e despesas para acompanhar seus pagamentos."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Cadastrar conta</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => {
            const days = daysUntil(e.due_date);
            return (
              <Card key={e.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => markAsPaid(e)} className="shrink-0">
                      {e.status === 'pago'
                        ? <CheckCircle2 size={22} className="text-success-600" />
                        : e.status === 'atrasado'
                        ? <AlertTriangle size={22} className="text-danger-600" />
                        : <Clock size={22} style={{ color: 'var(--text-muted)' }} />}
                    </button>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{e.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {e.category && <Badge>{e.category}</Badge>}
                        <Badge tone={STATUS_COLORS[e.status] as 'success'}>{STATUS_LABELS[e.status]}</Badge>
                        {e.recurring && <Badge tone="accent">Recorrente</Badge>}
                        {showOwner && e.owner_name && <span className="text-xs font-medium text-primary-600">· {e.owner_name}</span>}
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {e.status === 'pago' ? `Pago ${formatDate(e.paid_date)}` : `Vence ${formatDate(e.due_date)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(e.expected_amount)}</p>
                      {e.status === 'pendente' && days <= 3 && days >= 0 && <Badge tone="warning">Em {days}d</Badge>}
                      {e.status === 'pendente' && days < 0 && <Badge tone="danger">Atrasada</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(e); setIsVariable(e.type === 'variavel'); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(e)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ExpenseFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        accounts={accounts}
        cards={cards}
        userId={user?.id ?? ''}
        ownerName={profile?.full_name ?? ''}
        isVariable={isVariable}
        onSaved={() => { setModalOpen(false); refresh(); }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir conta"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tem certeza que deseja excluir <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.name}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

function PeriodSummaryCard({ title, summary, onClick, active }: { title: string; summary: { total: number; paid: number; pending: number }; onClick: () => void; active: boolean }) {
  return (
    <Card onClick={onClick} className={active ? 'ring-2 ring-primary-700' : ''}>
      <h3 className="mb-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Total</span><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(summary.total)}</span></div>
        <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Pago</span><span className="font-semibold text-success-600">{formatCurrency(summary.paid)}</span></div>
        <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-secondary)' }}>Pendente</span><span className="font-semibold text-warning-600">{formatCurrency(summary.pending)}</span></div>
      </div>
    </Card>
  );
}

function ExpenseFormModal({ open, onClose, editing, accounts, cards, userId, ownerName, isVariable, onSaved }: {
  open: boolean;
  onClose: () => void;
  editing: Expense | null;
  accounts: { id: string; name: string }[];
  cards: { id: string; name: string }[];
  userId: string;
  ownerName: string;
  isVariable: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '', description: '', category: '', expected_amount: '', paid_amount: '',
    due_date: todayISO(), paid_date: '', payment_method: '', account_id: '', card_id: '',
    status: 'pendente', type: isVariable ? 'variavel' : 'fixa', recurring: false, frequency: 'mensal',
    installments_total: '1', installment_current: '1', payment_period: '5', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? `new-${isVariable}`;
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      name: editing?.name ?? '', description: editing?.description ?? '', category: editing?.category ?? '',
      expected_amount: editing?.expected_amount?.toString() ?? '', paid_amount: editing?.paid_amount?.toString() ?? '',
      due_date: editing?.due_date ?? todayISO(), paid_date: editing?.paid_date ?? '',
      payment_method: editing?.payment_method ?? '', account_id: editing?.account_id ?? '', card_id: editing?.card_id ?? '',
      status: editing?.status ?? 'pendente', type: editing?.type ?? (isVariable ? 'variavel' : 'fixa'),
      recurring: editing?.recurring ?? false, frequency: editing?.frequency ?? 'mensal',
      installments_total: editing?.installments_total?.toString() ?? '1', installment_current: editing?.installment_current?.toString() ?? '1',
      payment_period: editing?.payment_period?.toString() ?? '5', notes: editing?.notes ?? '',
    });
  }

  const handleSave = async () => {
    if (!form.name || !form.expected_amount) return;
    setSaving(true);
    const payload = {
      name: form.name, description: form.description, category: form.category,
      expected_amount: parseFloat(form.expected_amount) || 0, paid_amount: parseFloat(form.paid_amount) || 0,
      due_date: form.due_date, paid_date: form.paid_date || null,
      payment_method: form.payment_method, account_id: form.account_id || null, card_id: form.card_id || null,
      status: form.status, type: form.type, recurring: form.recurring, frequency: form.frequency,
      installments_total: Number(form.installments_total), installment_current: Number(form.installment_current),
      payment_period: Number(form.payment_period), notes: form.notes,
    };
    if (editing) {
      await supabase.from('expenses').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('expenses').insert({ ...payload, user_id: userId, owner_name: ownerName });
    }
    setSaving(false);
    onSaved();
  };

  const categories = form.type === 'variavel' ? EXPENSE_CATEGORIES : FIXED_BILL_CATEGORIES;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar conta' : 'Nova conta'}
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da conta"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank" /></Field>
        <Field label="Categoria">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Selecione</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Valor previsto (R$)"><Input type="number" step="0.01" value={form.expected_amount} onChange={(e) => setForm({ ...form, expected_amount: e.target.value })} /></Field>
        <Field label="Valor pago (R$)"><Input type="number" step="0.01" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} /></Field>
        <Field label="Data de vencimento"><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
        <Field label="Data de pagamento"><Input type="date" value={form.paid_date} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Forma de pagamento">
          <Select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
            <option value="">Selecione</option>
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Conta ou cartão utilizado">
          <Select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value, card_id: '' })}>
            <option value="">Conta:</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <Field label="Cartão utilizado">
          <Select value={form.card_id} onChange={(e) => setForm({ ...form, card_id: e.target.value, account_id: '' })}>
            <option value="">Cartão:</option>
            {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Período de pagamento">
          <Select value={form.payment_period} onChange={(e) => setForm({ ...form, payment_period: e.target.value })}>
            <option value="5">Dia 5</option>
            <option value="15">Dia 15</option>
            <option value="0">Outro</option>
          </Select>
        </Field>
        <Field label="Tipo">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
          </Select>
        </Field>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="rounded" />
            Recorrente
          </label>
        </div>
        {form.recurring && (
          <Field label="Frequência">
            <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
              <option value="mensal">Mensal</option>
              <option value="semanal">Semanal</option>
              <option value="anual">Anual</option>
            </Select>
          </Field>
        )}
        <Field label="Quantidade de parcelas"><Input type="number" value={form.installments_total} onChange={(e) => setForm({ ...form, installments_total: e.target.value })} /></Field>
        <Field label="Parcela atual"><Input type="number" value={form.installment_current} onChange={(e) => setForm({ ...form, installment_current: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <Field label="Descrição"><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}
