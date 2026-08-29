import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Purchase } from '@/lib/types';
import { formatCurrency, formatDate, todayISO } from '@/lib/format';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

export function InstallmentsPage() {
  const { purchases, cards, loading, refresh } = useFinanceData();
  const { user, profile } = useAuth();
  const ownerName = profile?.full_name ?? '';
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Purchase | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('purchases').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Compras Parceladas</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Acompanhe suas compras parceladas</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Nova compra
        </Button>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Layers size={28} />}
            title="Nenhuma compra parcelada"
            description="Cadastre compras parceladas para acompanhar as parcelas futuras."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Cadastrar compra</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => {
            const card = cards.find((c) => c.id === p.card_id);
            const installmentValue = p.installments_total > 0 ? p.total_amount / p.installments_total : 0;
            return (
              <Card key={p.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{p.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <Badge tone="primary">{p.installment_current}/{p.installments_total}x</Badge>
                      {card && <Badge>{card.name}</Badge>}
                      {p.category && <Badge>{p.category}</Badge>}
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.purchase_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.total_amount)}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCurrency(installmentValue)}/parcela</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditing(p); setModalOpen(true); }} className="rounded-lg p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-muted)' }}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDelete(p)} className="rounded-lg p-1.5 hover:bg-danger-50 dark:hover:bg-danger-900/20" style={{ color: 'var(--text-muted)' }}>
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

      <PurchaseFormModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} cards={cards} userId={user?.id ?? ''} ownerName={ownerName} onSaved={() => { setModalOpen(false); refresh(); }} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir compra"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Excluir <strong>{confirmDelete?.description}</strong>?</p>
      </Modal>
    </div>
  );
}

function PurchaseFormModal({ open, onClose, editing, cards, userId, ownerName, onSaved }: { open: boolean; onClose: () => void; editing: Purchase | null; cards: { id: string; name: string }[]; userId: string; ownerName: string; onSaved: () => void }) {
  const [form, setForm] = useState({
    description: '', total_amount: '', installments_total: '1', installment_current: '1',
    purchase_date: todayISO(), card_id: '', category: '', notes: '',
  });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      description: editing?.description ?? '', total_amount: editing?.total_amount?.toString() ?? '',
      installments_total: editing?.installments_total?.toString() ?? '1', installment_current: editing?.installment_current?.toString() ?? '1',
      purchase_date: editing?.purchase_date ?? todayISO(), card_id: editing?.card_id ?? '', category: editing?.category ?? '', notes: editing?.notes ?? '',
    });
  }

  const installmentValue = form.installments_total && form.total_amount ? (parseFloat(form.total_amount) / parseInt(form.installments_total)) : 0;

  const handleSave = async () => {
    if (!form.description || !form.total_amount) return;
    setSaving(true);
    const payload = {
      description: form.description, total_amount: parseFloat(form.total_amount) || 0,
      installments_total: Number(form.installments_total), installment_current: Number(form.installment_current),
      purchase_date: form.purchase_date, card_id: form.card_id || null, category: form.category, notes: form.notes,
    };
    if (editing) await supabase.from('purchases').update(payload).eq('id', editing.id);
    else await supabase.from('purchases').insert({ ...payload, user_id: userId, owner_name: ownerName });
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar compra' : 'Nova compra parcelada'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Descrição"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Field label="Categoria">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Selecione</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Valor total (R$)"><Input type="number" step="0.01" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></Field>
        <Field label="Quantidade de parcelas"><Input type="number" min="1" value={form.installments_total} onChange={(e) => setForm({ ...form, installments_total: e.target.value })} /></Field>
        <Field label="Parcela atual"><Input type="number" min="1" value={form.installment_current} onChange={(e) => setForm({ ...form, installment_current: e.target.value })} /></Field>
        <Field label="Data da compra"><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></Field>
        <Field label="Cartão">
          <Select value={form.card_id} onChange={(e) => setForm({ ...form, card_id: e.target.value })}>
            <option value="">Selecione</option>
            {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        {installmentValue > 0 && (
          <div className="flex items-end">
            <div className="rounded-xl bg-primary-50 px-4 py-2 text-sm font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
              Valor por parcela: {formatCurrency(installmentValue)}
            </div>
          </div>
        )}
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}
