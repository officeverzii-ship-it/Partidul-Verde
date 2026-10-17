import {createFileRoute} from '@tanstack/react-router';
import {ContentPage} from '@/components/site/PageContent';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/confidentialitate')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Confidențialitate','Confidențialitate — Partidul Verde (Verzii).','/confidentialitate'),component:()=> <ContentPage slug='confidentialitate' title='Confidențialitate'/>});
