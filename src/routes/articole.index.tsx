import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {Layout,PageHeader} from '@/components/site/Layout';
import {ArticleCard} from '@/components/site/ArticleCard';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/articole/')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Articole','Noutăți și poziții publice ale Partidului Verde (Verzii).','/articole'),component:Archive});
function Archive(){const {data}=useSuspenseQuery(publicContentOptions);const [search,setSearch]=useState('');const rows=data.articles.filter(a=>a.kind==='articol'&&a.title.toLocaleLowerCase('ro').includes(search.toLocaleLowerCase('ro')));return <Layout><PageHeader eyebrow="Partidul Verde" title="Articole"/><section className="content-width py-10"><input aria-label="Caută articole" placeholder="Caută articole…" value={search} onChange={e=>setSearch(e.target.value)} className="field mb-8 max-w-md"/><div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{rows.map(a=><ArticleCard key={a.id} article={a}/>)}</div>{rows.length===0&&<p>Nu sunt articole pentru această selecție.</p>}</section></Layout>}
