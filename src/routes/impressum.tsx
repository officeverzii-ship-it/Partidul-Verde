import {createFileRoute} from '@tanstack/react-router';
import {ContentPage} from '@/components/site/PageContent';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/impressum')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Impressum','Impressum — Partidul Verde (Verzii).','/impressum'),component:()=> <ContentPage slug='impressum' title='Impressum'/>});
