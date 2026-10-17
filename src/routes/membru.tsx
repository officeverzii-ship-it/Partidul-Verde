import {createFileRoute} from '@tanstack/react-router';
import {MembershipForm} from '@/components/site/MembershipForm';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/membru')({head:()=>pageHead('Devino membru','Cerere de înscriere în Partidul Verde (Verzii).','/membru'),component:MembershipForm});
