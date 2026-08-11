import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const SEED_FLAG_KEY = 'fincontrol_seeded';

export function useSeedData() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const flag = localStorage.getItem(`${SEED_FLAG_KEY}_${user.id}`);
    if (flag === 'done') return;

    (async () => {
      // Check if user already has data
      const { data: existing } = await supabase
        .from('revenues')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        localStorage.setItem(`${SEED_FLAG_KEY}_${user.id}`, 'done');
        return;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const day5 = `${year}-${String(month + 1).padStart(2, '0')}-05`;
      const day15 = `${year}-${String(month + 1).padStart(2, '0')}-15`;

      // Seed revenues
      const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
      const ownerName = (profileData as { full_name: string } | null)?.full_name ?? '';

      await supabase.from('revenues').insert([
        { user_id: user.id, description: 'Salário do dia 5', category: 'Salário', amount: 1907.94, received_date: day5, received: false, type: 'fixa', recurring: true, frequency: 'mensal', payment_period: 5, owner_name: ownerName },
        { user_id: user.id, description: 'Salário do dia 15', category: 'Salário', amount: 1100.00, received_date: day15, received: false, type: 'fixa', recurring: true, frequency: 'mensal', payment_period: 15, owner_name: ownerName },
      ]);

      // Seed expenses - day 5
      const day5Bills = [
        { name: 'Nubank', category: 'Nubank', expected_amount: 829.35, due_date: day5, payment_period: 5, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Casa', category: 'Casa', expected_amount: 315.00, due_date: day5, payment_period: 5, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Condomínio', category: 'Condomínio', expected_amount: 175.00, due_date: day5, payment_period: 5, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Luz', category: 'Luz', expected_amount: 200.00, due_date: day5, payment_period: 5, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Internet', category: 'Internet', expected_amount: 60.00, due_date: day5, payment_period: 5, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Empréstimo', category: 'Empréstimo', expected_amount: 500.00, due_date: day5, payment_period: 5, type: 'fixa', recurring: true, status: 'pendente' },
      ];

      // Seed expenses - day 15
      const day15Bills = [
        { name: 'Carro', category: 'Carro', expected_amount: 500.00, due_date: day15, payment_period: 15, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Caixa', category: 'Caixa', expected_amount: 376.00, due_date: day15, payment_period: 15, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Inter', category: 'Inter', expected_amount: 0, due_date: day15, payment_period: 15, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Renner', category: 'Renner', expected_amount: 0, due_date: day15, payment_period: 15, type: 'fixa', recurring: true, status: 'pendente' },
        { name: 'Máquina', category: 'Máquina', expected_amount: 0, due_date: day15, payment_period: 15, type: 'fixa', recurring: true, status: 'pendente' },
      ];

      await supabase.from('expenses').insert([
        ...day5Bills.map((b) => ({ ...b, user_id: user.id, paid_amount: 0, owner_name: ownerName })),
        ...day15Bills.map((b) => ({ ...b, user_id: user.id, paid_amount: 0, owner_name: ownerName })),
      ]);

      // Seed emergency fund goal
      await supabase.from('goals').insert([
        { user_id: user.id, name: 'Reserva de Emergência', target_amount: 18000, saved_amount: 0, monthly_planned: 500, priority: 'alta', is_emergency_fund: true, owner_name: ownerName },
      ]);

      localStorage.setItem(`${SEED_FLAG_KEY}_${user.id}`, 'done');
    })();
  }, [user]);
}
