export function pageHead(title: string, description: string, path = '/', image?: string, type = 'website') {
  const fullTitle = `${title} — Partidul Verde (Verzii)`;
  const origin = import.meta.env['VITE_SITE_URL'] || 'https://partidulverde.lovable.app';
  return {
    meta: [
      { title: fullTitle }, { name: 'description', content: description },
      { property: 'og:title', content: fullTitle }, { property: 'og:description', content: description },
      { property: 'og:type', content: type }, { property: 'og:locale', content: 'ro_RO' },
      { property: 'og:url', content: `${origin}${path}` }, { name: 'twitter:card', content: 'summary_large_image' },
      ...(image?.startsWith('https://') ? [{ property: 'og:image', content: image }, { name: 'twitter:image', content: image }] : []),
    ],
    links: [{ rel: 'canonical', href: `${origin}${path}` }],
  };
}
