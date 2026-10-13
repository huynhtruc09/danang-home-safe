CREATE TABLE public.viewings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  owner_id uuid,
  renter_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  phone text,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.viewings TO authenticated;
GRANT ALL ON public.viewings TO service_role;
ALTER TABLE public.viewings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties read" ON public.viewings FOR SELECT TO authenticated USING (auth.uid() = renter_id OR auth.uid() = owner_id);
CREATE POLICY "renter creates" ON public.viewings FOR INSERT TO authenticated WITH CHECK (auth.uid() = renter_id);
CREATE POLICY "parties update" ON public.viewings FOR UPDATE TO authenticated USING (auth.uid() = renter_id OR auth.uid() = owner_id);