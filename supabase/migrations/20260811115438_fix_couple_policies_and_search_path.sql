-- Fix 1: Add search_path to is_partner SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.is_partner(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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

-- Fix 2: Allow any authenticated user to INSERT into couples (they create a pending couple)
-- The couple_members INSERT policy (auth.uid() = user_id) still protects who can join.
DROP POLICY IF EXISTS "insert_own_couples" ON public.couples;
CREATE POLICY "insert_own_couples" ON public.couples FOR INSERT
  TO authenticated WITH CHECK (true);

-- Fix 3: Allow reading couples where invited_email matches (so invitee can see their invite)
DROP POLICY IF EXISTS "select_own_couples" ON public.couples;
CREATE POLICY "select_own_couples" ON public.couples FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
    OR couples.invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Fix 4: Allow updating couples where invited_email matches (so invitee can accept/decline)
DROP POLICY IF EXISTS "update_own_couples" ON public.couples;
CREATE POLICY "update_own_couples" ON public.couples FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
    OR couples.invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.couple_members
      WHERE couple_members.couple_id = couples.id
      AND couple_members.user_id = auth.uid()
    )
    OR couples.invited_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );