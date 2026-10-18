alter table public.articles add column if not exists tags text[] not null default '{}';
alter table public.articles add column if not exists pdf_url text;
alter table public.site_pages add column if not exists seo_title text;
alter table public.site_pages add column if not exists seo_description text;
alter table public.site_pages add column if not exists og_image text;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "site settings public read" on public.site_settings for select to anon, authenticated using (true);
create policy "editors manage settings" on public.site_settings for all to authenticated using (has_role(auth.uid(),'admin_national'::app_role) or has_role(auth.uid(),'editor'::app_role)) with check (has_role(auth.uid(),'admin_national'::app_role) or has_role(auth.uid(),'editor'::app_role));

create policy "media public read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "editors upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and (public.has_role(auth.uid(),'admin_national'::app_role) or public.has_role(auth.uid(),'editor'::app_role)));
create policy "editors update media" on storage.objects for update to authenticated using (bucket_id = 'media' and (public.has_role(auth.uid(),'admin_national'::app_role) or public.has_role(auth.uid(),'editor'::app_role)));
create policy "editors delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and (public.has_role(auth.uid(),'admin_national'::app_role) or public.has_role(auth.uid(),'editor'::app_role)));

insert into public.articles (title, slug, kind, category, author_name, status, excerpt, content, tags) values
 ('[DEMO] Articol demonstrativ 1','demo-articol-1','articol','Demo','Echipa Verde','draft','Articol demonstrativ pentru testarea platformei.','Acesta este un articol demonstrativ. Înlocuiți-l cu conținut real din panoul de administrare.',array['demo','mediu']),
 ('[DEMO] Articol demonstrativ 2','demo-articol-2','articol','Demo','Echipa Verde','draft','Al doilea articol demonstrativ.','Conținut demonstrativ. Înlocuiți-l cu conținut real.',array['demo','economie']),
 ('[DEMO] Articol demonstrativ 3','demo-articol-3','articol','Demo','Echipa Verde','draft','Al treilea articol demonstrativ.','Conținut demonstrativ. Înlocuiți-l cu conținut real.',array['demo']),
 ('[DEMO] Comunicat demonstrativ 1','demo-comunicat-1','comunicat','Demo','Biroul de presă','draft','Comunicat de presă demonstrativ.','Conținut demonstrativ al comunicatului. Înlocuiți-l cu conținut real.',array['demo']),
 ('[DEMO] Comunicat demonstrativ 2','demo-comunicat-2','comunicat','Demo','Biroul de presă','draft','Al doilea comunicat demonstrativ.','Conținut demonstrativ al comunicatului. Înlocuiți-l cu conținut real.',array['demo'])
on conflict do nothing;

insert into public.events (title, description, starts_at, location, status) values
 ('[DEMO] Eveniment demonstrativ 1','Eveniment demonstrativ pentru testarea calendarului.', now() + interval '14 days','București','draft'),
 ('[DEMO] Eveniment demonstrativ 2','Al doilea eveniment demonstrativ.', now() + interval '30 days','Cluj-Napoca','draft')
on conflict do nothing;

insert into public.branches (name, city, county, coordinator, address)
select v.name, v.city, v.county, '[DEMO] Coordonator demonstrativ', null from (values
 ('[DEMO] Filiala Demo 1','Oraș Demo 1','Județ Demo 1'),
 ('[DEMO] Filiala Demo 2','Oraș Demo 2','Județ Demo 2'),
 ('[DEMO] Filiala Demo 3','Oraș Demo 3','Județ Demo 3')) as v(name, city, county)
where not exists (select 1 from public.branches b where b.name = v.name);