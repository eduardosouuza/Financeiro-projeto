import type { Revenue, Expense, Goal, Budget, Card, Purchase, Loan } from '@/lib/types';

export type MonthFinance = {
  totalRevenue: number;
  receivedRevenue: number;
  totalExpenses: number;
  paidExpenses: number;
  pendingExpenses: number;
  overdueExpenses: number;
  variableExpenses: number;
  balance: number;
  projectedBalance: number;
  totalSaved: number;
  committedPercent: number;
};

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + (b || 0), 0);
}

function isSameMonth(date: string | null, ref: Date): boolean {
  if (!date) return false;
  const d = new Date(date);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function calcMonthFinance(
  revenues: Revenue[],
  expenses: Expense[],
  goals: Goal[],
  ref: Date
): MonthFinance {
  const monthRevenues = revenues.filter((r) => r.received_date && isSameMonth(r.received_date, ref));
  const monthExpenses = expenses.filter((e) => e.due_date && isSameMonth(e.due_date, ref));
  const variableExpenses = monthExpenses.filter((e) => e.type === 'variavel');

  const totalRevenue = sum(monthRevenues.map((r) => r.amount));
  const receivedRevenue = sum(monthRevenues.filter((r) => r.received).map((r) => r.amount));
  const totalExpenses = sum(monthExpenses.map((e) => e.expected_amount));
  const paidExpenses = sum(monthExpenses.filter((e) => e.status === 'pago').map((e) => e.paid_amount));
  const pendingExpenses = sum(
    monthExpenses
      .filter((e) => e.status === 'pendente' || e.status === 'parcialmente_pago')
      .map((e) => e.expected_amount - e.paid_amount)
  );
  const overdueExpenses = sum(
    monthExpenses.filter((e) => e.status === 'atrasado').map((e) => e.expected_amount - e.paid_amount)
  );
  const variableTotal = sum(variableExpenses.map((e) => e.expected_amount));

  const balance = receivedRevenue - paidExpenses;
  const projectedBalance = totalRevenue - totalExpenses;
  const totalSaved = sum(goals.map((g) => g.saved_amount));
  const committedPercent = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  return {
    totalRevenue, receivedRevenue, totalExpenses, paidExpenses,
    pendingExpenses, overdueExpenses, variableExpenses: variableTotal,
    balance, projectedBalance, totalSaved, committedPercent,
  };
}

export function calcCardUsage(card: Card, purchases: Purchase[]) {
  const cardPurchases = purchases.filter((p) => p.card_id === card.id);
  const invoiceAmount = sum(cardPurchases.map((p) => p.total_amount / p.installments_total));
  const usedLimit = sum(cardPurchases.map((p) => p.total_amount));
  const availableLimit = (card.total_limit || 0) - usedLimit;
  const usagePercent = card.total_limit > 0 ? (usedLimit / card.total_limit) * 100 : 0;
  return { invoiceAmount, usedLimit, availableLimit, usagePercent };
}

export function calcLoanProgress(loan: Loan) {
  const percent = loan.installments_total > 0 ? (loan.installments_paid / loan.installments_total) * 100 : 0;
  const remaining = loan.installments_total - loan.installments_paid;
  return { percent, remaining };
}

export function calcGoalProgress(goal: Goal) {
  const percent = goal.target_amount > 0 ? (goal.saved_amount / goal.target_amount) * 100 : 0;
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  const monthsLeft = goal.deadline ? monthsUntil(goal.deadline) : 0;
  const monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
  return { percent, remaining, monthsLeft, monthlyNeeded };
}

function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

export function calcBudgetUsage(budget: Budget, expenses: Expense[], ref: Date) {
  const spent = sum(
    expenses
      .filter((e) => e.category === budget.category && e.due_date ? isSameMonth(e.due_date, ref) : false)
      .map((e) => e.paid_amount || e.expected_amount)
  );
  const remaining = Math.max(0, budget.monthly_limit - spent);
  const percent = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0;
  return { spent, remaining, percent };
}

export function calcDailyAverage(expenses: Expense[], ref: Date): number {
  const monthExpenses = expenses.filter((e) => e.due_date ? isSameMonth(e.due_date, ref) : false);
  const total = sum(monthExpenses.map((e) => e.paid_amount || e.expected_amount));
  const isCurrentMonth = new Date().getMonth() === ref.getMonth() && new Date().getFullYear() === ref.getFullYear();
  const day = isCurrentMonth
    ? Math.max(1, new Date().getDate())
    : new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return total / day;
}

export function getExpensesByCategory(expenses: Expense[], ref: Date): { category: string; amount: number }[] {
  const monthExpenses = expenses.filter((e) => e.due_date ? isSameMonth(e.due_date, ref) : false);
  const map = new Map<string, number>();
  for (const e of monthExpenses) {
    map.set(e.category || 'Outros', (map.get(e.category || 'Outros') || 0) + (e.paid_amount || e.expected_amount));
  }
  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

export function getMonthlyEvolution(revenues: Revenue[], expenses: Expense[], monthsBack: number): { month: string; receitas: number; despesas: number; saldo: number }[] {
  const now = new Date();
  const result: { month: string; receitas: number; despesas: number; saldo: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const rev = sum(revenues.filter((r) => r.received_date && isSameMonth(r.received_date, ref)).map((r) => r.amount));
    const exp = sum(expenses.filter((e) => e.due_date && isSameMonth(e.due_date, ref)).map((e) => e.paid_amount || e.expected_amount));
    result.push({
      month: ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      receitas: rev,
      despesas: exp,
      saldo: rev - exp,
    });
  }
  return result;
}

export function getProjected12Months(revenues: Revenue[], expenses: Expense[], loans: Loan[], goals: Goal[]): { month: string; saldo: number }[] {
  const now = new Date();
  const recurringRevenue = sum(revenues.filter((r) => r.recurring).map((r) => r.amount));
  const recurringExpense = sum(expenses.filter((e) => e.recurring).map((e) => e.expected_amount));
  const loanMonthly = sum(loans.filter((l) => l.status === 'ativo').map((l) => l.installment_amount));
  const goalMonthly = sum(goals.map((g) => g.monthly_planned));
  const monthlyNet = recurringRevenue - recurringExpense - loanMonthly - goalMonthly;

  let cumulative = 0;
  const result: { month: string; saldo: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const ref = new Date(now.getFullYear(), now.getMonth() + i, 1);
    cumulative += monthlyNet;
    result.push({
      month: ref.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      saldo: cumulative,
    });
  }
  return result;
}
