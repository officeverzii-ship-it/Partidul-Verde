import {createFileRoute} from '@tanstack/react-router';
import {CrudPage} from '@/components/admin/CrudPage';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/admin/pages')({head:()=>pageHead('Administrare pagini','Pagini și documente ale Partidului Verde.','/admin/pages'),component:()=> <CrudPage title="Pagini" table="site_pages" section="pages" searchField="title" fields={[{name:'title',label:'Titlu',required:true,inList:true},{name:'slug',label:'Identificator pagină',required:true,inList:true},{name:'content',label:'Conținut',type:'textarea',required:true},{name:'status',label:'Status',type:'select',required:true,inList:true,options:[{value:'draft',label:'Ciornă'},{value:'publicat',label:'Publicat'}]}]}/>});
