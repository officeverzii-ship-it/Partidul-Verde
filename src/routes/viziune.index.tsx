import {createFileRoute,Link} from '@tanstack/react-router';
import {Layout,PageHeader} from '@/components/site/Layout';
import {visionTopics} from '@/data/site';
import {pageHead} from '@/lib/seo';
import {Leaf,Landmark,Sun,Globe,Briefcase,Monitor,Heart,GraduationCap,Users,Palette,Building} from 'lucide-react';
const icons=[Landmark,Leaf,Sun,Globe,Briefcase,Monitor,Heart,GraduationCap,Users,Palette,Building];
export const Route=createFileRoute('/viziune/')({head:()=>pageHead('Viziune','Viziunea Verzilor pentru o Românie sănătoasă: democrație, mediu, economie și comunități.','/viziune'),component:()=> <Layout><PageHeader eyebrow="România sănătoasă" title="Viziune"/><section className="content-width grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">{visionTopics.map(([slug,title,lead],i)=>{const Icon=icons[i]??Leaf;return <Link key={slug} to="/viziune/$slug" params={{slug}} className="border-b border-border py-5"><Icon className="mb-4 size-12 text-brand"/><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 text-muted-foreground">{lead}</p></Link>})}</section></Layout>});
