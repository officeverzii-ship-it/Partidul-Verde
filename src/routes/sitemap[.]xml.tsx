import { createFileRoute } from '@tanstack/react-router';

const STATIC_PATHS = ['/', '/despre', '/viziune', '/echipa', '/filiale', '/articole', '/comunicate', '/evenimente', '/media', '/doneaza', '/contact', '/inscriere', '/voluntar', '/membru', '/confidentialitate', '/termeni-si-conditii', '/impressum'];

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const { createPublicBackendClient } = await import('@/lib/public-backend.server');
        const client = createPublicBackendClient();
        const [articles, pages] = await Promise.all([
          client.from('articles').select('slug,kind,published_at').eq('status', 'publicat'),
          client.from('site_pages').select('slug').eq('status', 'publicat'),
        ]);
        const origin = new URL(request.url).origin;
        const urls: string[] = [...STATIC_PATHS];
        for (const a of articles.data ?? []) urls.push(`/${a.kind === 'comunicat' ? 'comunicate' : 'articole'}/${a.slug}`);
        for (const p of pages.data ?? []) if (!STATIC_PATHS.includes(`/${p.slug}`)) urls.push(`/despre-noi/${p.slug}`);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${origin}${u}</loc></url>`).join('\n')}\n</urlset>`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
      },
    },
  },
});
