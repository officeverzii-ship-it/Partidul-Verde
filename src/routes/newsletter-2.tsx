import {createFileRoute} from '@tanstack/react-router';
import {Layout,PageHeader} from '@/components/site/Layout';
import {NewsletterForm} from '@/components/site/NewsletterForm';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/newsletter-2')({head:()=>pageHead('Newsletter','Abonare la newsletterul Partidului Verde.','/newsletter-2'),component:()=> <Layout><PageHeader eyebrow="Partidul Verde" title="Newsletter"/><section className="content-width py-10"><div className="max-w-xl"><NewsletterForm/></div></section></Layout>});
