import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, CreditCard, Layers, Settings } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Card as CardType, Purchase } from '@/lib/types';
import { formatCurrency, formatDate, todayISO } from '@/lib/format';
import { CARD_COLORS, EXPENSE_CATEGORIES } from '@/lib/constants';
import { calcCardUsage } from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useRouter } from '@/contexts/RouterContext';

export function CardsPage() {
  const { cards, purchases, loading, refresh } = useFinanceData();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CardType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CardType | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await supabase.from('cards').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    refresh();
  };

  if (loading) return <Loading />;

  const selectedCardData = cards.find((c) => c.id === selectedCard);
  const cardPurchases = purchases.filter((p) => p.card_id === selectedCard);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Cartões</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Controle seus cartões de crédito</p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }} className="shrink-0">
          <Plus size={18} /> Novo cartão
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CreditCard size={28} />}
            title="Nenhum cartão cadastrado"
            description="Cadastre seus cartões de crédito para acompanhar limites e faturas."
            action={<Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={18} /> Cadastrar cartão</Button>}
          />
        </Card>
      ) : (
        <>
          {/* Card visual list */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {cards.map((c) => {
              const usage = calcCardUsage(c, purchases);
              return (
                <div key={c.id} onClick={() => setSelectedCard(c.id)} className="cursor-pointer">
                  <div className="rounded-2xl p-4 text-white shadow-lg sm:p-5" style={{ backgroundColor: c.color, minHeight: 150 }}>
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium opacity-80">{c.bank || 'Cartão'}</p>
                        <p className="truncate text-base font-bold sm:text-lg">{c.name}</p>
                      </div>
                      <CreditCard size={24} className="shrink-0 opacity-80 sm:size-7" />
                    </div>
                    <p className="mt-5 text-base font-mono tracking-widest sm:text-lg">**** {c.last_digits || '••••'}</p>
                    <div className="mt-3 flex justify-between text-xs opacity-90">
                      <span>Fech. dia {c.closing_day}</span>
                      <span>Venc. dia {c.due_day}</span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Limite total</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(c.total_limit)}</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Utilizado</span><span className="font-medium text-danger-600">{formatCurrency(usage.usedLimit)}</span></div>
                    <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Disponível</span><span className="font-medium text-success-600">{formatCurrency(usage.availableLimit)}</span></div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, usage.usagePercent)}%`, backgroundColor: usage.usagePercent > 80 ? '#dc2626' : usage.usagePercent > 60 ? '#d97706' : '#059669' }} />
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{usage.usagePercent.toFixed(1)}% utilizado</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card detail modal */}
          <Modal
            open={!!selectedCard}
            onClose={() => setSelectedCard(null)}
            title={selectedCardData?.name ?? 'Cartão'}
            size="lg"
            footer={
              <>
                <Button variant="secondary" onClick={() => setSelectedCard(null)}>Fechar</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfirmDelete(selectedCardData);
                    setSelectedCard(null);
                  }}
                >
                  <Trash2 size={16} /> Excluir
                </Button>
                <Button onClick={() => navigate('installments')}><Layers size={16} /> Ver parcelas</Button>
              </>
            }
          >
            {selectedCardData && (
              <div className="space-y-4">
                <div className="rounded-2xl p-4 text-white sm:p-5" style={{ backgroundColor: selectedCardData.color }}>
                  <div className="flex justify-between">
                    <span className="truncate text-sm opacity-80">{selectedCardData.bank}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditing(selectedCardData);
                          setModalOpen(true);
                          setSelectedCard(null);
                        }}
                        className="rounded-full p-1 hover:bg-white/20 transition-colors"
                        title="Editar cartão"
                      >
                        <Settings size={20} className="shrink-0" />
                      </button>
                      <CreditCard size={24} className="shrink-0" />
                    </div>
                  </div>
                  <p className="mt-4 text-base font-mono tracking-widest sm:text-lg">**** {selectedCardData.last_digits}</p>
                  <div className="mt-2 flex justify-between text-xs opacity-90">
                    <span>Fechamento: dia {selectedCardData.closing_day}</span>
                    <span>Vencimento: dia {selectedCardData.due_day}</span>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Compras da fatura</h4>
                  {cardPurchases.length === 0 ? (
                    <EmptyState title="Sem compras" description="Nenhuma compra registrada neste cartão." />
                  ) : (
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {cardPurchases.map((p) => (
                        <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.description}</p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(p.purchase_date)} · {p.installments_total}x</p>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(p.total_amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Modal>
        </>
      )}

      <CardFormModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} editing={editing} userId={user?.id ?? ''} onSaved={() => { setModalOpen(false); setEditing(null); refresh(); }} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir cartão"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button><Button variant="danger" onClick={handleDelete}>Excluir</Button></>}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Excluir <strong>{confirmDelete?.name}</strong>?</p>
      </Modal>
    </div>
  );
}

function CardFormModal({ open, onClose, editing, userId, onSaved }: { open: boolean; onClose: () => void; editing: CardType | null; userId: string; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', bank: '', total_limit: '', closing_day: '1', due_day: '10', color: '#1e3a8a', last_digits: '' });
  const [saving, setSaving] = useState(false);

  const formKey = editing?.id ?? 'new';
  const [lastKey, setLastKey] = useState(formKey);
  if (formKey !== lastKey) {
    setLastKey(formKey);
    setForm({
      name: editing?.name ?? '', bank: editing?.bank ?? '', total_limit: editing?.total_limit?.toString() ?? '',
      closing_day: editing?.closing_day?.toString() ?? '1', due_day: editing?.due_day?.toString() ?? '10',
      color: editing?.color ?? '#1e3a8a', last_digits: editing?.last_digits ?? '',
    });
  }

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name, bank: form.bank, total_limit: parseFloat(form.total_limit) || 0,
      closing_day: Number(form.closing_day), due_day: Number(form.due_day),
      color: form.color, last_digits: form.last_digits,
    };
    if (editing) await supabase.from('cards').update(payload).eq('id', editing.id);
    else await supabase.from('cards').insert({ ...payload, user_id: userId });
    setSaving(false);
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar cartão' : 'Novo cartão'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Nubank" /></Field>
        <Field label="Banco"><Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} /></Field>
        <Field label="Limite total (R$)"><Input type="number" step="0.01" value={form.total_limit} onChange={(e) => setForm({ ...form, total_limit: e.target.value })} /></Field>
        <Field label="Últimos 4 dígitos"><Input value={form.last_digits} maxLength={4} onChange={(e) => setForm({ ...form, last_digits: e.target.value })} /></Field>
        <Field label="Dia de fechamento"><Input type="number" min="1" max="31" value={form.closing_day} onChange={(e) => setForm({ ...form, closing_day: e.target.value })} /></Field>
        <Field label="Dia de vencimento"><Input type="number" min="1" max="31" value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} /></Field>
        <Field label="Cor do cartão">
          <div className="flex flex-wrap gap-2">
            {CARD_COLORS.map((c) => (
              <button key={c.value} type="button" onClick={() => setForm({ ...form, color: c.value })}
                className={`h-9 w-9 rounded-lg border-2 ${form.color === c.value ? 'border-primary-700' : 'border-transparent'}`}
                style={{ backgroundColor: c.value }} title={c.name} />
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}
