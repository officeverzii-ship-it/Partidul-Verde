create type public.app_role as enum ('admin_national','admin_filiala','editor','coordonator_voluntari','membru','voluntar');

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  county text not null,
  coordinator text,
  address text,
  created_at timestamptz not null default now()
);
grant select on public.branches to anon, authenticated;
grant insert, update, delete on public.branches to authenticated;
grant all on public.branches to service_role;
alter table public.branches enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.user_branch(_user_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select branch_id from public.user_roles where user_id = _user_id and role = 'admin_filiala' limit 1
$$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin_national'));
create policy "national manages roles" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin_national')) with check (public.has_role(auth.uid(),'admin_national'));

create policy "branches public read" on public.branches for select to anon, authenticated using (true);
create policy "national manages branches" on public.branches for all to authenticated
  using (public.has_role(auth.uid(),'admin_national')) with check (public.has_role(auth.uid(),'admin_national'));

-- first user becomes national admin
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin_national') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin_national');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'membru');
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' and char_length(email) <= 255),
  phone text check (phone is null or phone ~ '^[0-9+().\s-]{9,20}$'),
  address text check (address is null or char_length(address) <= 200),
  branch_id uuid references public.branches(id) on delete set null,
  role text not null default 'membru',
  status text not null default 'in_asteptare' check (status in ('in_asteptare','activ','suspendat','retras')),
  dues_paid numeric(10,2) not null default 0,
  joined_at date not null default current_date,
  created_at timestamptz not null default now()
);
grant insert on public.members to anon;
grant select, insert, update, delete on public.members to authenticated;
grant all on public.members to service_role;
alter table public.members enable row level security;
create policy "public signup members" on public.members for insert to anon, authenticated
  with check (status = 'in_asteptare' and dues_paid = 0);
create policy "admins read members" on public.members for select to authenticated
  using (public.has_role(auth.uid(),'admin_national') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())));
create policy "admins update members" on public.members for update to authenticated
  using (public.has_role(auth.uid(),'admin_national') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())));
create policy "admins delete members" on public.members for delete to authenticated
  using (public.has_role(auth.uid(),'admin_national') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())));

create table public.volunteers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' and char_length(email) <= 255),
  phone text check (phone is null or phone ~ '^[0-9+().\s-]{9,20}$'),
  availability text check (availability is null or char_length(availability) <= 100),
  skills text check (skills is null or char_length(skills) <= 500),
  branch_id uuid references public.branches(id) on delete set null,
  status text not null default 'nou' check (status in ('nou','activ','inactiv')),
  created_at timestamptz not null default now()
);
grant insert on public.volunteers to anon;
grant select, insert, update, delete on public.volunteers to authenticated;
grant all on public.volunteers to service_role;
alter table public.volunteers enable row level security;
create policy "public signup volunteers" on public.volunteers for insert to anon, authenticated with check (status = 'nou');
create policy "staff manage volunteers" on public.volunteers for select to authenticated
  using (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'coordonator_voluntari') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())));
create policy "staff update volunteers" on public.volunteers for update to authenticated
  using (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'coordonator_voluntari') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())));
create policy "staff delete volunteers" on public.volunteers for delete to authenticated
  using (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'coordonator_voluntari'));

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  category text not null default 'General',
  kind text not null default 'articol' check (kind in ('articol','comunicat')),
  author_name text,
  author_id uuid,
  status text not null default 'draft' check (status in ('draft','publicat')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;
alter table public.articles enable row level security;
create policy "published articles public" on public.articles for select to anon, authenticated using (status = 'publicat');
create policy "editors manage articles" on public.articles for all to authenticated
  using (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'editor'))
  with check (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'editor'));

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  branch_id uuid references public.branches(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','publicat')),
  created_at timestamptz not null default now()
);
grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "published events public" on public.events for select to anon, authenticated using (status = 'publicat');
create policy "staff manage events" on public.events for all to authenticated
  using (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'editor') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())))
  with check (public.has_role(auth.uid(),'admin_national') or public.has_role(auth.uid(),'editor') or (public.has_role(auth.uid(),'admin_filiala') and branch_id = public.user_branch(auth.uid())));

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null check (char_length(donor_name) between 2 and 100),
  donor_email text not null check (donor_email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'),
  amount numeric(10,2) not null check (amount > 0 and amount <= 100000),
  method text not null default 'card',
  status text not null default 'in_asteptare' check (status in ('in_asteptare','confirmata','esuata','rambursata')),
  member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
grant insert on public.donations to anon;
grant select, insert, update, delete on public.donations to authenticated;
grant all on public.donations to service_role;
alter table public.donations enable row level security;
create policy "public donate" on public.donations for insert to anon, authenticated with check (status = 'in_asteptare');
create policy "national manages donations" on public.donations for select to authenticated using (public.has_role(auth.uid(),'admin_national'));
create policy "national updates donations" on public.donations for update to authenticated using (public.has_role(auth.uid(),'admin_national'));
create policy "national deletes donations" on public.donations for delete to authenticated using (public.has_role(auth.uid(),'admin_national'));

insert into public.branches (name, city, county, coordinator, address) values
 ('Filiala Centrală','București','București','Elena Stan','Str. Verdeții 12, Sector 3'),
 ('Filiala Nord','Cluj-Napoca','Cluj','Andrei Munteanu','Bd. Pădurea 8'),
 ('Filiala Vest','Timișoara','Timiș','Diana Lupu','Str. Fagului 45'),
 ('Filiala Est','Iași','Iași','Vlad Chiriac','Str. Teiului 3'),
 ('Filiala Carpați','Brașov','Brașov','Maria Oprea','Str. Zăvoiului 21'),
 ('Filiala Litoral','Constanța','Constanța','Sorin Albu','Bd. Mării 74');

insert into public.articles (title, slug, excerpt, content, category, kind, author_name, status, published_at) values
 ('Planul național de reîmpădurire pentru 2030','plan-reimpadurire-2030','500.000 de hectare replantate.','Propunem un program național coordonat de reîmpădurire.','Mediu','articol','Ana Dobre','publicat','2026-06-22'),
 ('Cum reducem poluarea din marile orașe','poluarea-in-marile-orase','Zone cu emisii reduse și senzori în fiecare cartier.','Calitatea aerului se măsoară, nu se presupune.','Orașe','articol','Mihai Ionescu','publicat','2026-06-15'),
 ('Poziția noastră privind OUG-ul energetic','pozitia-oug-energetic','Solicităm consultare publică reală.','Cerem suspendarea adoptării ordonanței.','Presă','comunicat','Radu Pop','publicat','2026-06-20');

insert into public.events (title, description, starts_at, location, status) values
 ('Adunare generală de vară','Votăm prioritățile pentru toamnă.','2026-07-05 10:00+03','Cluj-Napoca · Casa Verde','publicat'),
 ('Tabără ecologică pentru tineri','Ateliere despre climă și organizare civică.','2026-07-19 09:00+03','Brașov · Poiana Mică','publicat');
