import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, TrendingUp, Receipt, CreditCard, Target } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';
import { formatCurrency, formatDate, monthName, daysInMonth, todayISO } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type DayItem = { type: 'revenue' | 'expense' | 'card' | 'goal'; label: string; amount: number; status?: string };

export function CalendarPage() {
  const { revenues, expenses, cards, goals, loading } = useFinanceData();
  const [refDate, setRefDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const days = daysInMonth(year, month);
  const firstWeekday = new Date(year, month, 1).getDay();

  const dayItems = useMemo(() => {
    const map = new Map<number, DayItem[]>();
    const add = (day: number, item: DayItem) => {
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(item);
    };
    revenues.forEach((r) => {
      if (!r.received_date) return;
      const d = new Date(r.received_date);
      if (d.getMonth() === month && d.getFullYear() === year) add(d.getDate(), { type: 'revenue', label: r.description, amount: r.amount });
    });
    expenses.forEach((e) => {
      if (!e.due_date) return;
      const d = new Date(e.due_date);
      if (d.getMonth() === month && d.getFullYear() === year) add(d.getDate(), { type: 'expense', label: e.name, amount: e.expected_amount, status: e.status });
    });
    cards.forEach((c) => {
      add(c.due_day, { type: 'card', label: `Venc. ${c.name}`, amount: 0 });
      add(c.closing_day, { type: 'card', label: `Fech. ${c.name}`, amount: 0 });
    });
    goals.forEach((g) => {
      if (!g.deadline) return;
      const d = new Date(g.deadline);
      if (d.getMonth() === month && d.getFullYear() === year) add(d.getDate(), { type: 'goal', label: g.name, amount: g.target_amount });
    });
    return map;
  }, [revenues, expenses, cards, goals, month, year]);

  const selectedItems = selectedDay ? dayItems.get(selectedDay) ?? [] : [];

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>Calendário</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setRefDate(new Date(year, month - 1, 1))} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-28 text-center text-sm font-semibold sm:min-w-32" style={{ color: 'var(--text-primary)' }}>{monthName(month)} {year}</span>
          <button onClick={() => setRefDate(new Date(year, month + 1, 1))} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <LegendItem color="#059669" label="Receitas" />
        <LegendItem color="#dc2626" label="Contas" />
        <LegendItem color="#0891b2" label="Cartões" />
        <LegendItem color="#1e3a8a" label="Metas" />
      </div>

      <Card className="p-3 sm:p-5">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--text-muted)' }}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const items = dayItems.get(day) ?? [];
            const today = new Date();
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-h-14 rounded-lg border p-1 text-left transition-all hover:ring-2 hover:ring-primary-500/30 sm:min-h-16 sm:p-1.5 ${isToday ? 'border-primary-700' : ''}`}
                style={{ borderColor: isToday ? '#1e3a8a' : 'var(--border-color)', backgroundColor: 'var(--bg-elevated)' }}
              >
                <span className={`text-[11px] font-medium sm:text-xs ${isToday ? 'text-primary-700' : ''}`} style={{ color: isToday ? '#1e3a8a' : 'var(--text-secondary)' }}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-0.5 rounded px-0.5 py-0.5 text-[9px] truncate sm:gap-1 sm:px-1" style={{ backgroundColor: item.type === 'revenue' ? '#d1fae5' : item.type === 'expense' ? '#fee2e2' : item.type === 'card' ? '#e0f2fe' : '#dbeafe', color: item.type === 'revenue' ? '#047857' : item.type === 'expense' ? '#991b1b' : item.type === 'card' ? '#075985' : '#1e3a8a' }}>
                      {item.type === 'revenue' && <TrendingUp size={8} />}
                      {item.type === 'expense' && <Receipt size={8} />}
                      {item.type === 'card' && <CreditCard size={8} />}
                      {item.type === 'goal' && <Target size={8} />}
                      <span className="truncate">{item.label}</span>
                    </div>
                  ))}
                  {items.length > 3 && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{items.length - 3} mais</div>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Modal open={!!selectedDay} onClose={() => setSelectedDay(null)} title={`${selectedDay ?? ''} de ${monthName(month)} ${year}`}>
        {selectedItems.length === 0 ? (
          <EmptyState title="Nada agendado" description="Nenhuma movimentação neste dia." />
        ) : (
          <div className="space-y-2">
            {selectedItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  {item.type === 'revenue' && <TrendingUp size={18} className="text-success-600" />}
                  {item.type === 'expense' && <Receipt size={18} className="text-danger-600" />}
                  {item.type === 'card' && <CreditCard size={18} className="text-accent-600" />}
                  {item.type === 'goal' && <Target size={18} className="text-primary-700" />}
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.status && <Badge tone={item.status === 'pago' ? 'success' : item.status === 'atrasado' ? 'danger' : 'warning'}>{item.status}</Badge>}
                  {item.amount > 0 && <span className="text-sm font-bold" style={{ color: item.type === 'revenue' ? '#059669' : item.type === 'expense' ? '#dc2626' : 'var(--text-primary)' }}>{formatCurrency(item.amount)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
