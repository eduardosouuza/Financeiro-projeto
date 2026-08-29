import { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { useCouple } from '@/contexts/CoupleContext';
import { supabase } from '@/lib/supabase';
import type { Revenue } from '@/lib/types';
import { formatCurrency, formatDate, todayISO } from '@/lib/format';
import { REVENUE_CATEGORIES } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

export function RevenuesPage() {
  const { revenues, accounts, loading, refresh } = useFinanceData();
  const { user, profile } = useAuth();
  const { couple } = useCouple();
  const showOwner = couple?.status === 'active';
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Revenue | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Revenue | null>(null);

  const total = revenues.reduce((s, r) => s + r.amount, 0);
  const received = revenues.filter((r) => r.received).reduce((s, r) => s + r.amount, 0);

  const toggleReceived = async (rev: Revenue) => {
    await supabase.from('revenues').update({ received: !rev.received, received_date: !rev.received ? todayISO() : null }).eq('id', rev.id);
    refresh();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('revenues').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Receitas</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerencie suas fontes de renda</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Nova receita
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:gap-4">
        <StatBox label="Receita total" value={formatCurrency(total)} tone="success" />
        <StatBox label="Recebido" value={formatCurrency(received)} tone="primary" />
      </div>

      {revenues.length === 0 ? (
        <Card>
          <EmptyState
            icon={<TrendingUp size={28} />}
            title="Nenhuma receita cadastrada"
            description="Cadastre seus salários e outras fontes de renda para acompanhar suas finanças."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Cadastrar receita</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {revenues.map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => toggleReceived(r)} className="shrink-0">
                    {r.received
                      ? <CheckCircle2 size={22} className="text-success-600" />
                      : <Circle size={22} style={{ color: 'var(--text-muted)' }} />}
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {r.category && <Badge tone="success">{r.category}</Badge>}
                      {r.recurring && <Badge tone="accent">Recorrente</Badge>}
                      {showOwner && r.owner_name && <span className="text-xs font-medium text-primary-600">· {r.owner_name}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {r.received ? `Recebido ${formatDate(r.received_date)}` : `Previsto ${formatDate(r.received_date)}`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-bold" style={{ color: '#059669' }}>{formatCurrency(r.amount)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(r); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(r)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <RevenueFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        accounts={accounts}
        userId={user?.id ?? ''}
        ownerName={profile?.full_name ?? ''}
        onSaved={() => { setModalOpen(false); refresh(); }}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Excluir receita"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Tem certeza que deseja excluir <strong style={{ color: 'var(--text-primary)' }}>{confirmDelete?.description}</strong>? Esta ação não pode ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: string; tone: 'success' | 'primary' }) {
  const color = tone === 'success' ? '#059669' : '#1e3a8a';
  return (
    <div className="rounded-2xl p-3 sm:p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
      <p className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-1 text-lg font-bold sm:text-xl" style={{ color }}>{value}</p>
    </div>
  );
}

function RevenueFormModal({ open, onClose, editing, accounts, userId, ownerName, onSaved }: {
  open: boolean;
  onClose: () => void;
  editing: Revenue | null;
  accounts: { id: string; name: string }[];
  userId: string;
  ownerName: string;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    description: editing?.description ?? '',
    category: editing?.category ?? '',
    amount: editing?.amount?.toString() ?? '',
    received_date: editing?.received_date ?? todayISO(),
    received: editing?.received ?? false,
    type: editing?.type ?? 'fixa',
    recurring: editing?.recurring ?? false,
    frequency: editing?.frequency ?? 'mensal',
    account_id: editing?.account_id ?? '',
    notes: editing?.notes ?? '',
    payment_period: editing?.payment_period ?? 5,
  });
  const [saving, setSaving] = useState(false);

  // Reset form when editing changes
  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      description: editing?.description ?? '',
      category: editing?.category ?? '',
      amount: editing?.amount?.toString() ?? '',
      received_date: editing?.received_date ?? todayISO(),
      received: editing?.received ?? false,
      type: editing?.type ?? 'fixa',
      recurring: editing?.recurring ?? false,
      frequency: editing?.frequency ?? 'mensal',
      account_id: editing?.account_id ?? '',
      notes: editing?.notes ?? '',
      payment_period: editing?.payment_period ?? 5,
    });
  }

  const handleSave = async () => {
    if (!form.description || !form.amount) return;
    setSaving(true);
    const payload = {
      description: form.description,
      category: form.category,
      amount: parseFloat(form.amount) || 0,
      received_date: form.received_date,
      received: form.received,
      type: form.type,
      recurring: form.recurring,
      frequency: form.frequency,
      account_id: form.account_id || null,
      notes: form.notes,
      payment_period: Number(form.payment_period),
    };
    if (editing) {
      await supabase.from('revenues').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('revenues').insert({ ...payload, user_id: userId, owner_name: ownerName });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar receita' : 'Nova receita'}
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descrição"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Salário do dia 5" /></Field>
        <Field label="Categoria">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Selecione</option>
            {REVENUE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Valor (R$)"><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" /></Field>
        <Field label="Data de recebimento"><Input type="date" value={form.received_date} onChange={(e) => setForm({ ...form, received_date: e.target.value })} /></Field>
        <Field label="Período de pagamento">
          <Select value={form.payment_period} onChange={(e) => setForm({ ...form, payment_period: Number(e.target.value) })}>
            <option value={5}>Dia 5</option>
            <option value={15}>Dia 15</option>
            <option value={0}>Outro</option>
          </Select>
        </Field>
        <Field label="Tipo de receita">
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
          </Select>
        </Field>
        <Field label="Conta onde foi recebida">
          <Select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
            <option value="">Selecione</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.received} onChange={(e) => setForm({ ...form, received: e.target.checked })} className="rounded" />
            Recebido
          </label>
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
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}
