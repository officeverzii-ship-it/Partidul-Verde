import {createFileRoute,Link} from '@tanstack/react-router';
import {useSuspenseQuery} from '@tanstack/react-query';
import {Layout} from '@/components/site/Layout';
import {ArticleCard} from '@/components/site/ArticleCard';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
import forest from '@/assets/original/forest.jpg.asset.json';
import european from '@/assets/original/european.png.asset.json';
import {UserPlus,Heart,Mail,ExternalLink} from 'lucide-react';
export const Route=createFileRoute('/')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Acasă','România sănătoasă. Știri, viziune, înscriere și donații pentru Partidul Verde (Verzii).'),component:Home});
function Home(){const {data}=useSuspenseQuery(publicContentOptions);return <Layout home><section className="home-hero"><img src={forest.url} alt="Pădure și munți din România" width={1920} height={760} className="absolute inset-0 size-full object-cover"/><a href="https://europeangreens.eu" target="_blank" rel="noopener noreferrer" className="hero-partner" aria-label="European Greens — deschide site-ul într-o fereastră nouă"><img src={european.url} width={145} height={100} alt="European Greens"/><span className="hero-partner-tip" aria-hidden="true"><ExternalLink className="size-3.5 shrink-0"/><span>Deschide europeangreens.eu în altă fereastră</span></span></a><div className="hero-caption"><h1>România sănătoasă</h1></div></section>
<section className="join-band"><div className="content-width grid grid-cols-3 gap-5 py-6">{[{Icon:UserPlus,to:'/inscriere',label:'Înscrie-te în Partidul Verde!'},{Icon:Heart,to:'/doneaza',label:'Donează pentru o Românie sănătoasă!'},{Icon:Mail,to:'/newsletter-2',label:'Abonează-te la newsletter!'}].map(x=><Link key={x.to} to={x.to} className="join-item"><x.Icon className="size-10 text-brand" strokeWidth={1.5}/><span className="text-sm font-bold sm:text-base">{x.label}</span></Link>)}</div></section>
<section className="content-width py-10"><div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-2xl font-bold text-brand">Noutăți</h2><Link to="/media" className="text-sm text-brand underline">Toate articolele</Link></div><div className="grid gap-x-7 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{data.articles.slice(0,9).map(a=><ArticleCard key={a.id} article={a}/>)}</div>{data.articles.length===0&&<p>Nu sunt articole publicate momentan.</p>}</section></Layout>}
