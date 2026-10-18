import {createFileRoute} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useState} from 'react';
import {Layout,PageHeader} from '@/components/site/Layout';
import {ArticleCard} from '@/components/site/ArticleCard';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/articole/')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Articole','Noutăți și poziții publice ale Partidului Verde (Verzii).','/articole'),component:Archive});
function Archive(){
 const {data}=useSuspenseQuery(publicContentOptions);
 const [search,setSearch]=useState('');const [tag,setTag]=useState('');
 const all=data.articles.filter(a=>a.kind==='articol');
 const tags=Array.from(new Set(all.flatMap(a=>a.tags??[]))).sort((a,b)=>a.localeCompare(b,'ro'));
 const q=search.toLocaleLowerCase('ro');
 const rows=all.filter(a=>(!tag||(a.tags??[]).includes(tag))&&(!q||a.title.toLocaleLowerCase('ro').includes(q)||(a.excerpt??'').toLocaleLowerCase('ro').includes(q)||(a.tags??[]).some(t=>t.toLocaleLowerCase('ro').includes(q))));
 return <Layout><PageHeader eyebrow="Partidul Verde" title="Articole"/><section className="content-width py-10">
 <input aria-label="Caută articole" placeholder="Caută articole…" value={search} onChange={e=>setSearch(e.target.value)} className="field mb-6 max-w-md"/>
 {tags.length>0&&<div className="mb-8 flex flex-wrap gap-2"><button onClick={()=>setTag('')} className={`rounded-full border border-border px-3 py-1 text-sm ${!tag?'bg-brand text-inverse':'hover:bg-secondary'}`}>Toate</button>{tags.map(t=><button key={t} onClick={()=>setTag(t===tag?'':t)} className={`rounded-full border border-border px-3 py-1 text-sm ${tag===t?'bg-brand text-inverse':'hover:bg-secondary'}`}>#{t}</button>)}</div>}
 <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{rows.map(a=><ArticleCard key={a.id} article={a}/>)}</div>
 {rows.length===0&&<p>Nu sunt articole pentru această selecție.</p>}</section></Layout>;
}
