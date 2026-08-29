import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Budget } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { calcBudgetUsage } from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

export function BudgetsPage() {
  const { budgets, expenses, loading, refresh } = useFinanceData();
  const { user, profile } = useAuth();
  const ownerName = profile?.full_name ?? '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Budget | null>(null);
  const now = new Date();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('budgets').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Orçamentos</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Defina limites por categoria</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Novo orçamento
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet size={28} />}
            title="Nenhum orçamento definido"
            description="Crie limites mensais por categoria para controlar seus gastos."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Criar orçamento</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const usage = calcBudgetUsage(b, expenses, now);
            const tone = usage.percent >= 100 ? '#dc2626' : usage.percent >= 90 ? '#dc2626' : usage.percent >= 70 ? '#d97706' : '#059669';
            return (
              <Card key={b.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{b.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(usage.spent)} de {formatCurrency(b.monthly_limit)}</span>
                      <span className="text-xs font-medium" style={{ color: tone }}>{usage.percent.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: tone }}>{formatCurrency(usage.remaining)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(b); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(b)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, usage.percent)}%`, backgroundColor: tone }} />
                </div>
                {usage.percent >= 70 && (
                  <div className="mt-2 rounded-lg px-3 py-1.5 text-xs" style={{ backgroundColor: tone === '#059669' ? '#d1fae5' : tone === '#d97706' ? '#fef3c7' : '#fee2e2', color: tone }}>
                    {usage.percent >= 100 ? 'Orçamento excedido!' : usage.percent >= 90 ? 'Atenção: 90% do limite atingido' : '70% do limite atingido'}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <BudgetFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} userId={user?.id ?? ''} ownerName={ownerName} onSaved={() => { setModalOpen(false); refresh(); }} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir orçamento"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Excluir orçamento de <strong>{confirmDelete?.category}</strong>?</p>
      </Modal>
    </div>
  );
}

function BudgetFormModal({ open, onClose, editing, userId, ownerName, onSaved }: { open: boolean; onClose: () => void; editing: Budget | null; userId: string; ownerName: string; onSaved: () => void }) {
  const [form, setForm] = useState({ category: '', monthly_limit: '' });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({ category: editing?.category ?? '', monthly_limit: editing?.monthly_limit?.toString() ?? '' });
  }

  const handleSave = async () => {
    if (!form.category || !form.monthly_limit) return;
    setSaving(true);
    const payload = { category: form.category, monthly_limit: parseFloat(form.monthly_limit) || 0 };
    if (editing) await supabase.from('budgets').update(payload).eq('id', editing.id);
    else await supabase.from('budgets').insert({ ...payload, user_id: userId, owner_name: ownerName });
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar orçamento' : 'Novo orçamento'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
      <div className="grid gap-4">
        <Field label="Categoria">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Selecione</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Limite mensal (R$)"><Input type="number" step="0.01" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
