ALTER TABLE public.donations
  ADD COLUMN currency text NOT NULL DEFAULT 'RON',
  ADD COLUMN donation_type text NOT NULL DEFAULT 'unic',
  ADD COLUMN stripe_session_id text,
  ADD COLUMN stripe_customer_id text,
  ADD COLUMN stripe_subscription_id text,
  ADD COLUMN environment text NOT NULL DEFAULT 'sandbox';
CREATE UNIQUE INDEX donations_stripe_session_id_key ON public.donations (stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE POLICY "Donors view own donations by email"
  ON public.donations FOR SELECT TO authenticated
  USING (lower(donor_email) = lower(coalesce(auth.jwt() ->> 'email', '')));