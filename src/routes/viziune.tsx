import {createFileRoute,Outlet} from '@tanstack/react-router';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/viziune')({head:()=>pageHead('Viziune verde','Viziunea Partidului Verde pentru România: mediu, comunități și politici sustenabile.','/viziune'),component:()=> <Outlet/>});
