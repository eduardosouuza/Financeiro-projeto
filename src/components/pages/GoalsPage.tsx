import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Target, Shield, AlertCircle } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Goal } from '@/lib/types';
import { formatCurrency, formatDate, todayISO, monthName } from '@/lib/format';
import { calcGoalProgress, calcMonthFinance } from '@/lib/calculations';
import { PRIORITY_LABELS } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

export function GoalsPage() {
  const { goals, revenues, expenses, loading, refresh } = useFinanceData();
  const { user, profile } = useAuth();
  const ownerName = profile?.full_name ?? '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Goal | null>(null);

  const now = new Date();
  const finance = useMemo(() => calcMonthFinance(revenues, expenses, goals, now), [revenues, expenses, goals]);
  const avgExpense = finance.totalExpenses || 0;
  const emergencyFund = goals.find((g) => g.is_emergency_fund);
  const regularGoals = goals.filter((g) => !g.is_emergency_fund);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('goals').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Metas</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Defina e acompanhe seus objetivos</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Nova meta
        </Button>
      </div>

      {/* Emergency fund */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Reserva de Emergência</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Proteção financeira</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4">
          <InfoBox label="Atual" value={formatCurrency(emergencyFund?.saved_amount ?? 0)} color="#059669" />
          <InfoBox label="Meta" value={formatCurrency(emergencyFund?.target_amount ?? 0)} color="#1e3a8a" />
          <InfoBox label="Despesa média" value={formatCurrency(avgExpense)} color="#d97706" />
          <InfoBox label="Meses cobertos" value={`${avgExpense > 0 ? ((emergencyFund?.saved_amount ?? 0) / avgExpense).toFixed(1) : '0'} meses`} color="#0891b2" />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Sugestões de reserva:</p>
          {[3, 6, 12].map((m) => (
            <div key={m} className="flex items-center justify-between rounded-xl border p-2.5" style={{ borderColor: 'var(--border-color)' }}>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m} meses de despesas</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(avgExpense * m)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Regular goals */}
      {regularGoals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target size={28} />}
            title="Nenhuma meta criada"
            description="Crie metas como reserva de emergência, viagem, compra de equipamento e mais."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Criar meta</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          {regularGoals.map((g) => {
            const prog = calcGoalProgress(g);
            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge tone={g.priority === 'alta' ? 'danger' : g.priority === 'media' ? 'warning' : 'default'}>{PRIORITY_LABELS[g.priority] ?? g.priority}</Badge>
                      {g.deadline && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Até {formatDate(g.deadline)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(g); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(g)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(g.saved_amount)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(g.target_amount)}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className="h-full rounded-full bg-primary-700 transition-all" style={{ width: `${Math.min(100, prog.percent)}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>{prog.percent.toFixed(0)}% concluído</span>
                    <span style={{ color: 'var(--text-muted)' }}>Faltam {formatCurrency(prog.remaining)}</span>
                  </div>
                  {prog.monthsLeft > 0 && (
                    <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {prog.monthsLeft} meses · {formatCurrency(prog.monthlyNeeded)}/mês
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <GoalFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} userId={user?.id ?? ''} ownerName={ownerName} onSaved={() => { setModalOpen(false); refresh(); }} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir meta"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Excluir <strong>{confirmDelete?.name}</strong>?</p>
      </Modal>
    </div>
  );
}

function InfoBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)' }}>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="mt-0.5 text-sm font-bold truncate" style={{ color }}>{value}</p>
    </div>
  );
}

function GoalFormModal({ open, onClose, editing, userId, ownerName, onSaved }: { open: boolean; onClose: () => void; editing: Goal | null; userId: string; ownerName: string; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', target_amount: '', saved_amount: '', deadline: '', monthly_planned: '', priority: 'media', notes: '', is_emergency_fund: false });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      name: editing?.name ?? '', target_amount: editing?.target_amount?.toString() ?? '', saved_amount: editing?.saved_amount?.toString() ?? '',
      deadline: editing?.deadline ?? '', monthly_planned: editing?.monthly_planned?.toString() ?? '', priority: editing?.priority ?? 'media',
      notes: editing?.notes ?? '', is_emergency_fund: editing?.is_emergency_fund ?? false,
    });
  }

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name, target_amount: parseFloat(form.target_amount) || 0, saved_amount: parseFloat(form.saved_amount) || 0,
      deadline: form.deadline || null, monthly_planned: parseFloat(form.monthly_planned) || 0, priority: form.priority,
      notes: form.notes, is_emergency_fund: form.is_emergency_fund,
    };
    if (editing) await supabase.from('goals').update(payload).eq('id', editing.id);
    else await supabase.from('goals').insert({ ...payload, user_id: userId, owner_name: ownerName });
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar meta' : 'Nova meta'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da meta"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Viagem" /></Field>
        <Field label="Prioridade">
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Valor objetivo (R$)"><Input type="number" step="0.01" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} /></Field>
        <Field label="Valor já guardado (R$)"><Input type="number" step="0.01" value={form.saved_amount} onChange={(e) => setForm({ ...form, saved_amount: e.target.value })} /></Field>
        <Field label="Data limite"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
        <Field label="Valor mensal planejado (R$)"><Input type="number" step="0.01" value={form.monthly_planned} onChange={(e) => setForm({ ...form, monthly_planned: e.target.value })} /></Field>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.is_emergency_fund} onChange={(e) => setForm({ ...form, is_emergency_fund: e.target.checked })} className="rounded" />
            Esta é a minha reserva de emergência
          </label>
        </div>
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}
