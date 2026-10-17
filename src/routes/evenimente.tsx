import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Layout,PageHeader} from '@/components/site/Layout';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/evenimente')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Evenimente','Calendarul evenimentelor Partidului Verde.','/evenimente'),component:Events});
function Events(){const {data}=useSuspenseQuery(publicContentOptions);return <Layout><PageHeader eyebrow="Partidul Verde" title="Evenimente"/><section className="content-width py-10">{data.events.map(e=><article key={e.id} className="border-b border-border py-6"><p className="text-sm text-brand">{new Date(e.starts_at).toLocaleString('ro-RO')}</p><h2 className="mt-2 text-2xl font-bold">{e.title}</h2><p className="mt-3">{e.location}</p><p className="mt-3 whitespace-pre-line text-muted-foreground">{e.description}</p></article>)}{data.events.length===0&&<p>Nu sunt evenimente publicate momentan.</p>}</section></Layout>}
