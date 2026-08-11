/*
# Sistema de Organização Financeira Pessoal - Esquema do Banco de Dados

## Visão Geral
Cria o esquema completo de tabelas para um sistema multi-usuário de organização financeira pessoal,
onde cada usuário autenticado vê apenas seus próprios dados. Todas as tabelas são vinculadas ao
usuário autenticado via coluna `user_id` com default `auth.uid()`.

## Novas Tabelas
- `profiles`: perfil do usuário (nome)
- `financial_accounts`: contas financeiras (Nubank, Inter, Caixa, Renner, etc.)
- `categories`: categorias de receitas e despesas
- `cards`: cartões de crédito
- `revenues`: receitas do usuário
- `expenses`: contas e despesas fixas/variáveis
- `purchases`: compras em cartões
- `installments`: parcelas de compras parceladas
- `loans`: empréstimos
- `goals`: metas financeiras
- `budgets`: orçamentos por categoria
- `notifications`: alertas do sistema
- `settings`: configurações do usuário (tema, etc.)

## Segurança
- RLS habilitado em todas as tabelas
- Políticas owner-scoped (auth.uid() = user_id) para todas as operações CRUD
- user_id com DEFAULT auth.uid() para inserts funcionarem sem passar o owner
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profiles" ON public.profiles;
CREATE POLICY "select_own_profiles" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profiles" ON public.profiles;
CREATE POLICY "insert_own_profiles" ON public.profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profiles" ON public.profiles;
CREATE POLICY "update_own_profiles" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- FINANCIAL ACCOUNTS (contas financeiras)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank text DEFAULT '',
  type text NOT NULL DEFAULT 'conta',
  balance numeric(12,2) DEFAULT 0,
  color text DEFAULT '#1e3a8a',
  last_digits text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_financial_accounts" ON public.financial_accounts;
CREATE POLICY "select_own_financial_accounts" ON public.financial_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_financial_accounts" ON public.financial_accounts;
CREATE POLICY "insert_own_financial_accounts" ON public.financial_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_financial_accounts" ON public.financial_accounts;
CREATE POLICY "update_own_financial_accounts" ON public.financial_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_financial_accounts" ON public.financial_accounts;
CREATE POLICY "delete_own_financial_accounts" ON public.financial_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL DEFAULT 'expense',
  color text DEFAULT '#64748b',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_categories" ON public.categories;
CREATE POLICY "select_own_categories" ON public.categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_categories" ON public.categories;
CREATE POLICY "insert_own_categories" ON public.categories FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_categories" ON public.categories;
CREATE POLICY "update_own_categories" ON public.categories FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_categories" ON public.categories;
CREATE POLICY "delete_own_categories" ON public.categories FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- CARDS (cartões de crédito)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bank text DEFAULT '',
  total_limit numeric(12,2) DEFAULT 0,
  closing_day int DEFAULT 1,
  due_day int DEFAULT 10,
  color text DEFAULT '#1e3a8a',
  last_digits text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cards" ON public.cards;
CREATE POLICY "select_own_cards" ON public.cards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cards" ON public.cards;
CREATE POLICY "insert_own_cards" ON public.cards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cards" ON public.cards;
CREATE POLICY "update_own_cards" ON public.cards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_cards" ON public.cards;
CREATE POLICY "delete_own_cards" ON public.cards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- REVENUES (receitas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.revenues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  category text DEFAULT '',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  received_date date,
  received boolean DEFAULT false,
  type text DEFAULT 'fixa',
  recurring boolean DEFAULT false,
  frequency text DEFAULT 'mensal',
  account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  payment_period int DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_revenues" ON public.revenues;
CREATE POLICY "select_own_revenues" ON public.revenues FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_revenues" ON public.revenues;
CREATE POLICY "insert_own_revenues" ON public.revenues FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_revenues" ON public.revenues;
CREATE POLICY "update_own_revenues" ON public.revenues FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_revenues" ON public.revenues;
CREATE POLICY "delete_own_revenues" ON public.revenues FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- EXPENSES (contas e despesas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT '',
  expected_amount numeric(12,2) DEFAULT 0,
  paid_amount numeric(12,2) DEFAULT 0,
  due_date date,
  paid_date date,
  payment_method text DEFAULT '',
  account_id uuid REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  status text DEFAULT 'pendente',
  type text DEFAULT 'fixa',
  recurring boolean DEFAULT false,
  frequency text DEFAULT 'mensal',
  installments_total int DEFAULT 1,
  installment_current int DEFAULT 1,
  payment_period int DEFAULT 5,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_expenses" ON public.expenses;
CREATE POLICY "select_own_expenses" ON public.expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_expenses" ON public.expenses;
CREATE POLICY "insert_own_expenses" ON public.expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_expenses" ON public.expenses;
CREATE POLICY "update_own_expenses" ON public.expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_expenses" ON public.expenses;
CREATE POLICY "delete_own_expenses" ON public.expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- PURCHASES (compras em cartões)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  description text NOT NULL,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  installments_total int DEFAULT 1,
  installment_current int DEFAULT 1,
  purchase_date date,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  category text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_purchases" ON public.purchases;
CREATE POLICY "select_own_purchases" ON public.purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_purchases" ON public.purchases;
CREATE POLICY "insert_own_purchases" ON public.purchases FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_purchases" ON public.purchases;
CREATE POLICY "update_own_purchases" ON public.purchases FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_purchases" ON public.purchases;
CREATE POLICY "delete_own_purchases" ON public.purchases FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- INSTALLMENTS (parcelas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  installment_number int NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date,
  paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_installments" ON public.installments;
CREATE POLICY "select_own_installments" ON public.installments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_installments" ON public.installments;
CREATE POLICY "insert_own_installments" ON public.installments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_installments" ON public.installments;
CREATE POLICY "update_own_installments" ON public.installments FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_installments" ON public.installments;
CREATE POLICY "delete_own_installments" ON public.installments FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- LOANS (empréstimos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  institution text DEFAULT '',
  total_amount numeric(12,2) DEFAULT 0,
  installment_amount numeric(12,2) DEFAULT 0,
  installments_total int DEFAULT 1,
  installments_paid int DEFAULT 0,
  start_date date,
  due_day int DEFAULT 5,
  interest numeric(5,2) DEFAULT 0,
  outstanding_balance numeric(12,2) DEFAULT 0,
  status text DEFAULT 'ativo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_loans" ON public.loans;
CREATE POLICY "select_own_loans" ON public.loans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_loans" ON public.loans;
CREATE POLICY "insert_own_loans" ON public.loans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_loans" ON public.loans;
CREATE POLICY "update_own_loans" ON public.loans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_loans" ON public.loans;
CREATE POLICY "delete_own_loans" ON public.loans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- GOALS (metas financeiras)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric(12,2) DEFAULT 0,
  saved_amount numeric(12,2) DEFAULT 0,
  deadline date,
  monthly_planned numeric(12,2) DEFAULT 0,
  priority text DEFAULT 'media',
  notes text DEFAULT '',
  is_emergency_fund boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON public.goals;
CREATE POLICY "select_own_goals" ON public.goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_goals" ON public.goals;
CREATE POLICY "insert_own_goals" ON public.goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_goals" ON public.goals;
CREATE POLICY "update_own_goals" ON public.goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_goals" ON public.goals;
CREATE POLICY "delete_own_goals" ON public.goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- BUDGETS (orçamentos por categoria)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  monthly_limit numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_budgets" ON public.budgets;
CREATE POLICY "select_own_budgets" ON public.budgets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_budgets" ON public.budgets;
CREATE POLICY "insert_own_budgets" ON public.budgets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_budgets" ON public.budgets;
CREATE POLICY "update_own_budgets" ON public.budgets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_budgets" ON public.budgets;
CREATE POLICY "delete_own_budgets" ON public.budgets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS (alertas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text DEFAULT '',
  type text DEFAULT 'info',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON public.notifications;
CREATE POLICY "insert_own_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON public.notifications;
CREATE POLICY "delete_own_notifications" ON public.notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SETTINGS (configurações do usuário)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'light',
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON public.settings;
CREATE POLICY "select_own_settings" ON public.settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON public.settings;
CREATE POLICY "insert_own_settings" ON public.settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON public.settings;
CREATE POLICY "update_own_settings" ON public.settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON public.settings;
CREATE POLICY "delete_own_settings" ON public.settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_revenues_user_id ON public.revenues(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_installments_user_id ON public.installments(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON public.loans(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- ============================================================
-- TRIGGER: criar profile automaticamente no signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.settings (user_id, theme) VALUES (NEW.id, 'light');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();