import {createFileRoute} from '@tanstack/react-router';
import {MembershipForm} from '@/components/site/MembershipForm';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/inscriere')({head:()=>pageHead('Înscriere','Înscriere online și formular de adeziune la Partidul Verde (Verzii).','/inscriere'),component:MembershipForm});
