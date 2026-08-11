import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertTriangle, Clock, CreditCard, Target } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatDate, daysUntil } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';

type AlertItem = { id: string; title: string; message: string; type: 'danger' | 'warning' | 'accent'; icon: React.ReactNode };

export function NotificationsPage() {
  const { expenses, cards, purchases, budgets, loading, refresh } = useFinanceData();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const items: AlertItem[] = [];
    expenses.forEach((e) => {
      if (e.status === 'atrasado') {
        items.push({ id: `exp-late-${e.id}`, title: 'Conta atrasada', message: `${e.name} venceu em ${formatDate(e.due_date)}`, type: 'danger', icon: <AlertTriangle size={18} /> });
      } else if (e.status === 'pendente' || e.status === 'parcialmente_pago') {
        const d = daysUntil(e.due_date);
        if (d < 0) {
          items.push({ id: `exp-late-${e.id}`, title: 'Conta atrasada', message: `${e.name} venceu em ${formatDate(e.due_date)}`, type: 'danger', icon: <AlertTriangle size={18} /> });
        } else if (d <= 3) {
          items.push({ id: `exp-due-${e.id}`, title: 'Vencendo em breve', message: `${e.name} vence em ${d} dia(s)`, type: 'warning', icon: <Clock size={18} /> });
        }
      }
    });
    cards.forEach((c) => {
      const used = purchases.filter((p) => p.card_id === c.id).reduce((s, p) => s + p.total_amount, 0);
      const pct = c.total_limit > 0 ? (used / c.total_limit) * 100 : 0;
      if (pct >= 80) {
        items.push({ id: `card-${c.id}`, title: 'Limite do cartão próximo do fim', message: `${c.name} está com ${pct.toFixed(0)}% do limite usado`, type: 'warning', icon: <CreditCard size={18} /> });
      }
    });
    budgets.forEach((b) => {
      const spent = expenses.filter((e) => e.category === b.category).reduce((s, e) => s + (e.paid_amount || e.expected_amount), 0);
      const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
      if (pct >= 90) {
        items.push({ id: `bud-${b.id}`, title: 'Orçamento excedido', message: `${b.category} atingiu ${pct.toFixed(0)}% do limite`, type: 'danger', icon: <Target size={18} /> });
      } else if (pct >= 70) {
        items.push({ id: `bud-${b.id}`, title: 'Orçamento próximo do limite', message: `${b.category} atingiu ${pct.toFixed(0)}% do limite`, type: 'warning', icon: <Target size={18} /> });
      }
    });
    setAlerts(items);
  }, [expenses, cards, purchases, budgets]);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    refresh();
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Notificações</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Alertas e avisos importantes</p>
        </div>
        {alerts.length > 0 && <Button variant="ghost" size="sm" onClick={markAllRead} className="shrink-0"><Check size={16} /> <span className="hidden sm:inline">Marcar lidas</span></Button>}
      </div>

      {alerts.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell size={28} />} title="Tudo em dia" description="Nenhum alerta no momento. Suas finanças estão sob controle." />
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
                  style={{ backgroundColor: a.type === 'danger' ? '#fee2e2' : a.type === 'warning' ? '#fef3c7' : '#e0f2fe', color: a.type === 'danger' ? '#dc2626' : a.type === 'warning' ? '#d97706' : '#0891b2' }}>
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{a.message}</p>
                </div>
                <span className="shrink-0"><Badge tone={a.type}>{a.type === 'danger' ? 'Urgente' : a.type === 'warning' ? 'Atenção' : 'Info'}</Badge></span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
