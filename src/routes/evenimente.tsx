import {createFileRoute,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {useMemo,useState} from 'react';
import {Layout,PageHeader} from '@/components/site/Layout';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/evenimente')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Evenimente','Calendarul evenimentelor Partidului Verde.','/evenimente'),component:Events});
const MONTHS=['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
const DAYS=['L','Ma','Mi','J','V','S','D'];
function Events(){
 const {data}=useSuspenseQuery(publicContentOptions);
 const now=new Date();
 const [ym,setYm]=useState({y:now.getFullYear(),m:now.getMonth()});
 const cells=useMemo(()=>{
  const first=new Date(ym.y,ym.m,1);const offset=(first.getDay()+6)%7;const days=new Date(ym.y,ym.m+1,0).getDate();
  return {offset,days};
 },[ym]);
 const byDay=(d:number)=>data.events.filter(e=>{const t=new Date(e.starts_at);return t.getFullYear()===ym.y&&t.getMonth()===ym.m&&t.getDate()===d;});
 const shift=(d:number)=>setYm(p=>{const m=p.m+d;return {y:p.y+Math.floor(m/12),m:((m%12)+12)%12};});
 return <Layout><PageHeader eyebrow="Partidul Verde" title="Evenimente"/><section className="content-width py-10">
 <div className="mb-10 max-w-2xl">
  <div className="mb-4 flex items-center justify-between"><button aria-label="Luna anterioară" onClick={()=>shift(-1)} className="rounded-lg border border-border px-3 py-1 hover:bg-secondary">←</button><h2 className="text-xl font-bold capitalize">{MONTHS[ym.m]} {ym.y}</h2><button aria-label="Luna următoare" onClick={()=>shift(1)} className="rounded-lg border border-border px-3 py-1 hover:bg-secondary">→</button></div>
  <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground">{DAYS.map((d,i)=><span key={i} className="py-1">{d}</span>)}</div>
  <div className="grid grid-cols-7 gap-1">
   {Array.from({length:cells.offset}).map((_,i)=><span key={`e${i}`}/>)}
   {Array.from({length:cells.days}).map((_,i)=>{const d=i+1;const ev=byDay(d);return <div key={d} className={`min-h-12 rounded-lg border p-1 text-sm ${ev.length?'border-brand bg-secondary':'border-border'}`}><span className="text-xs">{d}</span>{ev.map(e=><Link key={e.id} to="/evenimente/$id" params={{id:e.id}} className="mt-1 block truncate rounded bg-brand px-1 text-[11px] text-inverse" title={e.title}>{e.title}</Link>)}</div>;})}
  </div>
 </div>
 <h2 className="mb-4 text-2xl font-bold">Toate evenimentele</h2>
 {data.events.map(e=><article key={e.id} className="border-b border-border py-6"><p className="text-sm text-brand">{new Date(e.starts_at).toLocaleString('ro-RO')}</p><h3 className="mt-2 text-2xl font-bold"><Link to="/evenimente/$id" params={{id:e.id}} className="hover:text-brand">{e.title}</Link></h3><p className="mt-3">{e.location}</p></article>)}
 {data.events.length===0&&<p>Nu sunt evenimente publicate momentan.</p>}</section></Layout>;
}
