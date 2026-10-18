import {createFileRoute,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {z} from 'zod';
import {Layout,PageHeader} from '@/components/site/Layout';
import {ArticleCard} from '@/components/site/ArticleCard';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
import {mediaCategories} from '@/data/site';

const search=z.object({categorie:z.enum(['toate','comunicate','documente','evenimente','stiri']).optional().catch(undefined)});
export const Route=createFileRoute('/media')({validateSearch:search,loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Media','Comunicate, documente, evenimente și știri ale Partidului Verde (Verzii).','/media'),component:Archive});

function Archive(){
  const {data}=useSuspenseQuery(publicContentOptions);
  const {categorie='toate'}=Route.useSearch();
  const [q,setQ]=useState('');
  const current=mediaCategories.find(c=>c.slug===categorie)??mediaCategories[4];
  const rows=data.articles.filter(a=>(categorie==='toate'||(a.tags??[]).includes(current.label)||a.category===current.label)&&a.title.toLocaleLowerCase('ro').includes(q.toLocaleLowerCase('ro')));
  return <Layout><PageHeader eyebrow="Partidul Verde" title={categorie==='toate'?'Media':current.label}/>
  <section className="content-width py-10">
    <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrează">
      {mediaCategories.map(c=><Link key={c.slug} to="/media" search={c.slug==='toate'?{}:{categorie:c.slug}} className={`rounded-full border px-4 py-2 text-sm font-semibold ${c.slug===categorie?'border-primary bg-primary text-primary-foreground':'border-border hover:bg-secondary'}`} aria-current={c.slug===categorie?'page':undefined}>{c.label}</Link>)}
      <input aria-label="Caută articole" placeholder="Caută…" value={q} onChange={e=>setQ(e.target.value)} className="field ml-auto max-w-xs"/>
    </div>
    <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{rows.map(a=><ArticleCard key={a.id} article={a}/>)}</div>
    {rows.length===0&&<p>Nu sunt articole pentru această selecție.</p>}
  </section></Layout>;
}
