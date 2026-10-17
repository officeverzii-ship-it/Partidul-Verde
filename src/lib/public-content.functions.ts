import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const getPublicContent = createServerFn({ method: 'GET' }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Conexiunea la conținut nu este configurată.');
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const [articles, events, branches, pages] = await Promise.all([
    client.from('articles').select('id,title,slug,excerpt,content,category,kind,author_name,published_at,image_url').eq('status', 'publicat').order('published_at', { ascending: false, nullsFirst: false }),
    client.from('events').select('id,title,description,starts_at,location').eq('status', 'publicat').order('starts_at', { ascending: true }),
    client.from('branches').select('id,name,city,county,coordinator,address').order('county'),
    client.from('site_pages').select('id,slug,title,content').eq('status', 'publicat'),
  ]);
  for (const result of [articles, events, branches, pages]) if (result.error) throw new Error('Conținutul nu a putut fi încărcat.');
  return { articles: articles.data ?? [], events: events.data ?? [], branches: branches.data ?? [], pages: pages.data ?? [] };
});
