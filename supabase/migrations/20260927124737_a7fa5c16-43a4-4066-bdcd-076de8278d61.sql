alter table public.donations
  add column cnp text,
  add column street text,
  add column city text,
  add column county text,
  add column phone text,
  add column citizenship_confirmed boolean not null default false,
  add column terms_accepted boolean not null default false,
  add column ep_transaction_id text,
  add column processor_message text,
  add column paid_at timestamptz;