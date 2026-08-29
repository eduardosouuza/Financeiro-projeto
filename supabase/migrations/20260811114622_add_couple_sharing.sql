/*
# Couple/Partner Sharing Support

## Overview
Adds the ability for two users to link their accounts as a couple, so they can
share financial data and organize finances together. Each couple has exactly
two members. Either partner can invite the other by email; the invited partner
accepts to join. Once linked, both partners see each other's revenues, expenses,
cards, goals, etc. — each item is tagged with who created it (owner_name).

## New Tables
- `couples`: represents a couple link (status: pending/active/declined)
- `couple_members`: join table linking users to a couple (role: inviter/invitee)

## Modified Tables
- `profiles`: adds `partner_email` (text) — email of partner to link with
- All financial tables: adds `owner_name` (text) — display name of creator

## Security
- RLS on couples and couple_members, owner-scoped via membership.
- Financial table SELECT policies broadened: user reads own + partner's data.
- INSERT/UPDATE/DELETE remain strictly owner-scoped.
*/

-- ============================================================
-- COUPLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  invited_email text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COUPLE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.couple_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id uuid NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'inviter',
  joined_at timestamptz DEFAULT now()
);

ALTER TABLE public.couple_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COUPLE MEMBERS POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_own_couple_members" ON public.couple_members;
CREATE POLICY "select_own_couple_members" ON public.couple_members FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.couple_members cm2
      WHERE cm2.couple_id = couple_members.couple_id
      AND cm2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_couple_members" ON public.couple_members;
CREATE POLICY "insert_own_couple_members" ON public.couple_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_couple_members" ON public.couple_members;
CREATE POLICY "update_own_couple_members" ON public.couple_members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_couple_members" ON public.couple_members;
CREATE POLICY "delete_own_couple_members" ON public.couple_members FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- COUPLES POLICIES
-- ============================================================
DROP POLICY IF EXISTS "select_own_couples" ON public.couples;
CREATE POLICY "select_own_couples" ON public.couples FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_couples" ON public.couples;
CREATE POLICY "insert_own_couples" ON public.couples FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_couples" ON public.couples;
CREATE POLICY "update_own_couples" ON public.couples FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_couples" ON public.couples;
CREATE POLICY "delete_own_couples" ON public.couples FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- PROFILES: add partner_email
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'partner_email') THEN
    ALTER TABLE public.profiles ADD COLUMN partner_email text DEFAULT '';
  END IF;
END $$;

-- ============================================================
-- FINANCIAL TABLES: add owner_name column
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'revenues' AND column_name = 'owner_name') THEN
    ALTER TABLE public.revenues ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'owner_name') THEN
    ALTER TABLE public.expenses ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'cards' AND column_name = 'owner_name') THEN
    ALTER TABLE public.cards ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'purchases' AND column_name = 'owner_name') THEN
    ALTER TABLE public.purchases ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'loans' AND column_name = 'owner_name') THEN
    ALTER TABLE public.loans ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'owner_name') THEN
    ALTER TABLE public.goals ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'budgets' AND column_name = 'owner_name') THEN
    ALTER TABLE public.budgets ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'financial_accounts' AND column_name = 'owner_name') THEN
    ALTER TABLE public.financial_accounts ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'owner_name') THEN
    ALTER TABLE public.categories ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'installments' AND column_name = 'owner_name') THEN
    ALTER TABLE public.installments ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'owner_name') THEN
    ALTER TABLE public.notifications ADD COLUMN owner_name text DEFAULT '';
  END IF;
END $$;

-- ============================================================
-- HELPER FUNCTION: is_partner
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_partner(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.couple_members cm1
    JOIN public.couple_members cm2
      ON cm1.couple_id = cm2.couple_id
      AND cm1.user_id <> cm2.user_id
    JOIN public.couples c
      ON c.id = cm1.couple_id
      AND c.status = 'active'
    WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = target_user_id
  );
$$;

-- ============================================================
-- BROADEN SELECT POLICIES: allow reading partner's data
-- ============================================================
DROP POLICY IF EXISTS "select_own_revenues" ON public.revenues;
CREATE POLICY "select_own_revenues" ON public.revenues FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_expenses" ON public.expenses;
CREATE POLICY "select_own_expenses" ON public.expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_cards" ON public.cards;
CREATE POLICY "select_own_cards" ON public.cards FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_purchases" ON public.purchases;
CREATE POLICY "select_own_purchases" ON public.purchases FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_loans" ON public.loans;
CREATE POLICY "select_own_loans" ON public.loans FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_goals" ON public.goals;
CREATE POLICY "select_own_goals" ON public.goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_budgets" ON public.budgets;
CREATE POLICY "select_own_budgets" ON public.budgets FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_financial_accounts" ON public.financial_accounts;
CREATE POLICY "select_own_financial_accounts" ON public.financial_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_categories" ON public.categories;
CREATE POLICY "select_own_categories" ON public.categories FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_installments" ON public.installments;
CREATE POLICY "select_own_installments" ON public.installments FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_partner(user_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_couple_members_user_id ON public.couple_members(user_id);
CREATE INDEX IF NOT EXISTS idx_couple_members_couple_id ON public.couple_members(couple_id);
CREATE INDEX IF NOT EXISTS idx_couples_invited_email ON public.couples(invited_email);
CREATE INDEX IF NOT EXISTS idx_couples_status ON public.couples(status);