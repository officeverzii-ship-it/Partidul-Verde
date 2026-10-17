import {createFileRoute,notFound} from '@tanstack/react-router';
import {ContentPage} from '@/components/site/PageContent';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/despre-noi/$slug')({loader:async({context,params})=>{const data=await context.queryClient.ensureQueryData(publicContentOptions);const page=data.pages.find(x=>x.slug===`despre-noi__${params.slug}`);if(!page)throw notFound();return page;},head:({loaderData,params})=>pageHead(loaderData?.title??'Pagina indisponibilă',loaderData?.content.slice(0,160)??'Partidul Verde',`/despre-noi/${params.slug}`),component:()=>{const page=Route.useLoaderData();return <ContentPage slug={page.slug} title={page.title}/>}});
