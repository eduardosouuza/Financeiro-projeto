import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type {
  Revenue, Expense, Card, Purchase, Loan, Goal, Budget,
  FinancialAccount, Category, Notification, Couple, CoupleMember,
} from '@/lib/types';

export function useFinanceData() {
  const { user } = useAuth();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [coupleMembers, setCoupleMembers] = useState<CoupleMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [rev, exp, crd, pur, loa, gol, bud, acc, cat, not] = await Promise.all([
      supabase.from('revenues').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('cards').select('*').order('created_at', { ascending: false }),
      supabase.from('purchases').select('*').order('created_at', { ascending: false }),
      supabase.from('loans').select('*').order('created_at', { ascending: false }),
      supabase.from('goals').select('*').order('created_at', { ascending: false }),
      supabase.from('budgets').select('*').order('created_at', { ascending: false }),
      supabase.from('financial_accounts').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ]);

    setRevenues(rev.data as Revenue[] ?? []);
    setExpenses(exp.data as Expense[] ?? []);
    setCards(crd.data as Card[] ?? []);
    setPurchases(pur.data as Purchase[] ?? []);
    setLoans(loa.data as Loan[] ?? []);
    setGoals(gol.data as Goal[] ?? []);
    setBudgets(bud.data as Budget[] ?? []);
    setAccounts(acc.data as FinancialAccount[] ?? []);
    setCategories(cat.data as Category[] ?? []);
    setNotifications(not.data as Notification[] ?? []);

    // Fetch couple data
    const { data: memberData } = await supabase
      .from('couple_members')
      .select('*, couples!couple_members_couple_id_fkey(*)')
      .eq('user_id', user.id);

    if (memberData && memberData.length > 0) {
      const firstCouple = (memberData[0] as unknown as { couples: Couple }).couples;
      setCouple(firstCouple);
      const { data: allMembers } = await supabase
        .from('couple_members')
        .select('*')
        .eq('couple_id', firstCouple.id);
      setCoupleMembers(allMembers as CoupleMember[] ?? []);
    } else {
      setCouple(null);
      setCoupleMembers([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    revenues, expenses, cards, purchases, loans, goals, budgets, accounts, categories, notifications,
    couple, coupleMembers,
    loading, refresh: fetchAll,
    setRevenues, setExpenses, setCards, setPurchases, setLoans, setGoals, setBudgets, setAccounts, setCategories, setNotifications,
  };
}
