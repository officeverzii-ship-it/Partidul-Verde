import {createFileRoute} from '@tanstack/react-router';
import {ContentPage} from '@/components/site/PageContent';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/echipa')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Biroul Permanent Național','Conducerea Partidului Verde (Verzii).','/echipa'),component:()=> <ContentPage slug='despre-noi__biroul-permanent-national' title='Biroul Permanent Național'/>});
