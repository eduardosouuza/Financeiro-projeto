import { useState } from 'react';
import { Plus, Pencil, Trash2, Landmark } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Loan } from '@/lib/types';
import { formatCurrency, formatDate, todayISO } from '@/lib/format';
import { calcLoanProgress } from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

export function LoansPage() {
  const { loans, loading, refresh } = useFinanceData();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Loan | null>(null);

  const totalOutstanding = loans.filter((l) => l.status === 'ativo').reduce((s, l) => s + l.outstanding_balance, 0);
  const totalMonthly = loans.filter((l) => l.status === 'ativo').reduce((s, l) => s + l.installment_amount, 0);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('loans').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Empréstimos</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Acompanhe seus empréstimos</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Novo empréstimo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Saldo devedor</p>
          <p className="mt-1 text-lg font-bold text-danger-600 sm:text-xl">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)' }}>
          <p className="text-xs uppercase" style={{ color: 'var(--text-muted)' }}>Parcela mensal</p>
          <p className="mt-1 text-lg font-bold text-warning-600 sm:text-xl">{formatCurrency(totalMonthly)}</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Landmark size={28} />}
            title="Nenhum empréstimo"
            description="Cadastre seus empréstimos para acompanhar o progresso de quitação."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Cadastrar empréstimo</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {loans.map((l) => {
            const prog = calcLoanProgress(l);
            return (
              <Card key={l.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{l.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      {l.institution && <Badge>{l.institution}</Badge>}
                      <Badge tone={l.status === 'ativo' ? 'warning' : 'success'}>{l.status === 'ativo' ? 'Ativo' : 'Quitado'}</Badge>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.installments_paid}/{l.installments_total} parcelas</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(l.outstanding_balance)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(l.installment_amount)}/parcela</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(l); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(l)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-muted)' }}>{prog.percent.toFixed(0)}% quitado</span>
                    <span style={{ color: 'var(--text-muted)' }}>{prog.remaining} parcelas restantes</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                    <div className="h-full rounded-full bg-success-600 transition-all" style={{ width: `${Math.min(100, prog.percent)}%` }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LoanFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} userId={user?.id ?? ''} onSaved={() => { setModalOpen(false); refresh(); }} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir empréstimo"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Excluir <strong>{confirmDelete?.name}</strong>?</p>
      </Modal>
    </div>
  );
}

function LoanFormModal({ open, onClose, editing, userId, onSaved }: { open: boolean; onClose: () => void; editing: Loan | null; userId: string; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: '', institution: '', total_amount: '', installment_amount: '', installments_total: '1',
    installments_paid: '0', start_date: todayISO(), due_day: '5', interest: '', outstanding_balance: '', status: 'ativo',
  });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      name: editing?.name ?? '', institution: editing?.institution ?? '', total_amount: editing?.total_amount?.toString() ?? '',
      installment_amount: editing?.installment_amount?.toString() ?? '', installments_total: editing?.installments_total?.toString() ?? '1',
      installments_paid: editing?.installments_paid?.toString() ?? '0', start_date: editing?.start_date ?? todayISO(),
      due_day: editing?.due_day?.toString() ?? '5', interest: editing?.interest?.toString() ?? '',
      outstanding_balance: editing?.outstanding_balance?.toString() ?? '', status: editing?.status ?? 'ativo',
    });
  }

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name, institution: form.institution, total_amount: parseFloat(form.total_amount) || 0,
      installment_amount: parseFloat(form.installment_amount) || 0, installments_total: Number(form.installments_total),
      installments_paid: Number(form.installments_paid), start_date: form.start_date, due_day: Number(form.due_day),
      interest: parseFloat(form.interest) || 0, outstanding_balance: parseFloat(form.outstanding_balance) || 0, status: form.status,
    };
    if (editing) await supabase.from('loans').update(payload).eq('id', editing.id);
    else await supabase.from('loans').insert({ ...payload, user_id: userId });
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar empréstimo' : 'Novo empréstimo'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Instituição"><Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} /></Field>
        <Field label="Valor total (R$)"><Input type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></Field>
        <Field label="Valor da parcela (R$)"><Input type="number" step="0.01" value={form.installment_amount} onChange={(e) => setForm({ ...form, installment_amount: e.target.value })} /></Field>
        <Field label="Total de parcelas"><Input type="number" value={form.installments_total} onChange={(e) => setForm({ ...form, installments_total: e.target.value })} /></Field>
        <Field label="Parcelas pagas"><Input type="number" value={form.installments_paid} onChange={(e) => setForm({ ...form, installments_paid: e.target.value })} /></Field>
        <Field label="Saldo devedor (R$)"><Input type="number" step="0.01" value={form.outstanding_balance} onChange={(e) => setForm({ ...form, outstanding_balance: e.target.value })} /></Field>
        <Field label="Juros (%)"><Input type="number" step="0.01" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></Field>
        <Field label="Data de início"><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
        <Field label="Dia de vencimento"><Input type="number" min="1" max="31" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ativo">Ativo</option>
            <option value="quitado">Quitado</option>
            <option value="pausado">Pausado</option>
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
