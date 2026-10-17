import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Layout, PageHeader } from './Layout';
import { publicContentOptions } from '@/lib/public-content';
export function RichText({ text }: { text: string }) {
 return <div className="prose-site">{text.split(/\n\s*\n/).map((p,i)=>{
  const plain=p.replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim();
  if (!plain) return null;
  const heading=plain.match(/^(#{1,6})\s+(.+)/);
  if(heading)return <h2 key={i}>{(heading[2] ?? '').replace(/\*\*/g,'')}</h2>;
  const parts=plain.split(/(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);
  return <p key={i}>{parts.map((part,j)=>{const m=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);return m?<a key={j} href={m[2] ?? "#"} target="_blank" rel="noopener noreferrer">{(m[1] ?? '').replace(/\*\*/g,'')}</a>:part.replace(/\*\*/g,'');})}</p>;
 })}</div>;
}
export function ContentPage({ slug, title }: {slug:string;title:string}) {
 const {data}=useSuspenseQuery(publicContentOptions);const item=data.pages.find(p=>p.slug===slug);
 return <Layout><PageHeader eyebrow="Partidul Verde (Verzii)" title={item?.title??title}/><section className="content-width py-10"><RichText text={item?.content??'Conținutul acestei pagini nu este disponibil momentan.'}/><Link to="/contact" className="mt-8 inline-block text-brand underline">Contactează-ne</Link></section></Layout>;
}
