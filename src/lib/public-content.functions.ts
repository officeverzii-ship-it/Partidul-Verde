import { createServerFn } from '@tanstack/react-start';

export type SiteSettings = Record<string, any>;

export const getPublicContent = createServerFn({ method: 'GET' }).handler(async () => {
  const { createPublicBackendClient } = await import('./public-backend.server');
  const client = createPublicBackendClient();
  const [articles, events, branches, pages, settings] = await Promise.all([
    client.from('articles').select('id,title,slug,excerpt,content,category,kind,author_name,published_at,image_url,tags,pdf_url').eq('status', 'publicat').order('published_at', { ascending: false, nullsFirst: false }),
    client.from('events').select('id,title,description,starts_at,location').eq('status', 'publicat').order('starts_at', { ascending: true }),
    client.rpc('public_branches'),
    client.from('site_pages').select('id,slug,title,content,seo_title,seo_description,og_image').eq('status', 'publicat'),
    client.from('site_settings').select('key,value'),
  ]);
  for (const result of [articles, events, branches, pages, settings]) if (result.error) throw new Error('Conținutul nu a putut fi încărcat.');
  const settingsMap: SiteSettings = {};
  for (const row of settings.data ?? []) settingsMap[row.key] = row.value;
  return { articles: articles.data ?? [], events: events.data ?? [], branches: branches.data ?? [], pages: pages.data ?? [], settings: settingsMap };
});
