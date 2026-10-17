import {createFileRoute,Link} from '@tanstack/react-router';
import {Layout,PageHeader} from '@/components/site/Layout';
import {aboutLinks} from '@/data/site';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/despre')({head:()=>pageHead('Despre noi','Conducere, statut, program politic și comunitatea Partidului Verde.','/despre'),component:()=> <Layout><PageHeader eyebrow="Partidul Verde" title="Despre noi"/><section className="content-width grid gap-0 py-9 sm:grid-cols-2">{aboutLinks.map(x=><Link key={x.label} to={x.to} params={'slug'in x?{slug:x.slug}:{}} className="border-b border-border py-6 text-xl font-bold text-brand">{x.label} →</Link>)}</section></Layout>});
