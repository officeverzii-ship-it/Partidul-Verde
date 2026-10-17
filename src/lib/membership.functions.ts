import {createServerFn} from '@tanstack/react-start';
import {createClient} from '@supabase/supabase-js';
import type {Database} from '@/integrations/supabase/types';
import {membershipSchema} from './membership-schema';
export const submitMembership=createServerFn({method:'POST'}).inputValidator((v:unknown)=>membershipSchema.parse(v)).handler(async({data})=>{
 const url=process.env['SUPABASE_URL'];const key=process.env['SUPABASE_PUBLISHABLE_KEY'];if(!url||!key)throw new Error('Serviciul de înscriere nu este disponibil.');
 const client=createClient<Database>(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers);if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const {data:branches}=await client.from('branches').select('id').eq('county',data.county).limit(1);
 const {error}=await client.from('members').insert({...data,branch_id:branches?.[0]?.id??null,status:'in_asteptare',dues_paid:0});
 if(error)throw new Error('Cererea nu a putut fi înregistrată. Verifică datele și încearcă din nou.');return {success:true};
});
