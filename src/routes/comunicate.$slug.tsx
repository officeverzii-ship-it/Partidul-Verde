import {createFileRoute,Link,notFound} from '@tanstack/react-router';
import {Layout} from '@/components/site/Layout';
import {RichText} from '@/components/site/PageContent';
import {dateLabel} from '@/components/site/ArticleCard';
import {publicContentOptions} from '@/lib/public-content';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/comunicate/$slug')({loader:async({context,params})=>{const data=await context.queryClient.ensureQueryData(publicContentOptions);const article=data.articles.find(a=>a.slug===params.slug&&a.kind==='comunicat');if(!article)throw notFound();return article;},head:({loaderData,params})=>pageHead(loaderData?.title??'Articol indisponibil',loaderData?.excerpt??'Partidul Verde',`/comunicate/${params.slug}`,loaderData?.image_url??undefined,'article'),component:Article});
function Article(){const a=Route.useLoaderData();return <Layout><article className="content-width py-10"><Link to="/comunicate" className="text-sm text-brand">← Înapoi</Link><p className="mt-5 text-sm text-muted-foreground">{dateLabel(a.published_at)} · {a.author_name}</p><h1 className="mt-3 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl">{a.title}</h1>{a.image_url&&<img src={a.image_url} alt={a.title} className="my-8 max-h-[620px] w-full max-w-3xl object-contain object-left"/>}<RichText text={a.content}/></article></Layout>}
