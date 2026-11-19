DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
REVOKE SELECT ON public.profiles FROM anon;

DROP POLICY IF EXISTS "listing images read" ON storage.objects;
CREATE POLICY "listing images owner read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listing-images'::text AND (storage.foldername(name))[1] = (select auth.uid()::text));