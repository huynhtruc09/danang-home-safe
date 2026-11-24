DROP POLICY IF EXISTS "roommates read" ON public.roommate_profiles;
CREATE POLICY "roommates authenticated read" ON public.roommate_profiles FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.roommate_profiles FROM anon;

