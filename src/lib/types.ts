export type Profile = {
  id: string;
  full_name: string;
  partner_email: string;
  created_at: string;
};

export type Couple = {
  id: string;
  status: 'pending' | 'active' | 'declined';
  invited_email: string;
  created_at: string;
};

export type CoupleMember = {
  id: string;
  couple_id: string;
  user_id: string;
  role: 'inviter' | 'invitee';
  joined_at: string;
};

export type FinancialAccount = {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  type: string;
  balance: number;
  color: string;
  last_digits: string;
  owner_name: string;
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  kind: 'income' | 'expense';
  color: string;
  owner_name: string;
  created_at: string;
};

export type Card = {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  total_limit: number;
  closing_day: number;
  due_day: number;
  color: string;
  last_digits: string;
  owner_name: string;
  created_at: string;
};

export type Revenue = {
  id: string;
  user_id: string;
  description: string;
  category: string;
  amount: number;
  received_date: string | null;
  received: boolean;
  type: string;
  recurring: boolean;
  frequency: string;
  account_id: string | null;
  notes: string;
  payment_period: number;
  owner_name: string;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  expected_amount: number;
  paid_amount: number;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string;
  account_id: string | null;
  card_id: string | null;
  status: 'pendente' | 'pago' | 'atrasado' | 'parcialmente_pago' | 'cancelado';
  type: string;
  recurring: boolean;
  frequency: string;
  installments_total: number;
  installment_current: number;
  payment_period: number;
  notes: string;
  owner_name: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  user_id: string;
  description: string;
  total_amount: number;
  installments_total: number;
  installment_current: number;
  purchase_date: string | null;
  card_id: string | null;
  category: string;
  notes: string;
  owner_name: string;
  created_at: string;
};

export type Installment = {
  id: string;
  user_id: string;
  purchase_id: string;
  card_id: string | null;
  installment_number: number;
  amount: number;
  due_date: string | null;
  paid: boolean;
  owner_name: string;
  created_at: string;
};

export type Loan = {
  id: string;
  user_id: string;
  name: string;
  institution: string;
  total_amount: number;
  installment_amount: number;
  installments_total: number;
  installments_paid: number;
  start_date: string | null;
  due_day: number;
  interest: number;
  outstanding_balance: number;
  status: string;
  owner_name: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  monthly_planned: number;
  priority: string;
  notes: string;
  is_emergency_fund: boolean;
  owner_name: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  owner_name: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  owner_name: string;
  created_at: string;
};

export type Settings = {
  id: string;
  user_id: string;
  theme: string;
  currency: string;
  created_at: string;
};
