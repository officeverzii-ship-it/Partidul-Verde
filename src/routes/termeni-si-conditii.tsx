import {createFileRoute} from '@tanstack/react-router';
import {ContentPage} from '@/components/site/PageContent';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/termeni-si-conditii')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Termeni și condiții','Termeni și condiții — Partidul Verde (Verzii).','/termeni-si-conditii'),component:()=> <ContentPage slug='termeni-si-conditii' title='Termeni și condiții'/>});
