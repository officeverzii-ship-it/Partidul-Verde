import {createFileRoute} from '@tanstack/react-router';
import {ContentPage} from '@/components/site/PageContent';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/misiune')({loader:({context})=>context.queryClient.ensureQueryData(publicContentOptions),head:()=>pageHead('Programul politic','România sănătoasă — programul politic al Partidului Verde.','/misiune'),component:()=> <ContentPage slug='despre-noi__romania-sanatoasa-noul-program-politic-al-partidului-verde' title='România sănătoasă'/>});
