import {createServerFn} from '@tanstack/react-start';
import {membershipSchema} from './membership-schema';

export const submitMembership=createServerFn({method:'POST'}).inputValidator((v:unknown)=>membershipSchema.parse(v)).handler(async({data})=>{
 const {createPublicBackendClient}=await import('./public-backend.server');
 const client=createPublicBackendClient();
 const {data:branches}=await client.rpc('public_branches');
 const branchId=branches?.find(b=>b.county===data.county)?.id??null;

 // Datele sensibile (CNP, adresă) se salvează criptat; cele în clar rămân pentru compatibilitate cu triggerul de validare existent.
 const {data:encCnp}=await client.rpc('encrypt_sensitive' as never,{p_text:data.cnp} as never);
 const {data:encAddr}=await client.rpc('encrypt_sensitive' as never,{p_text:data.address} as never);

 // Fără .select() după insert: anonimii pot insera cereri, dar nu citi membri.
 const {error}=await client.from('members').insert({
   ...data,
   branch_id:branchId,
   status:'in_asteptare',
   dues_paid:0,
   email_confirmed:false,
   cnp_encrypted:(encCnp as string|null)??null,
   address_encrypted:(encAddr as string|null)??null,
 } as never);
 if(error)throw new Error('Cererea nu a putut fi înregistrată. Verifică datele și încearcă din nou.');

 // Deduplicare contact CRM după email (prin funcția securizată; anonimii nu citesc contactele)
 await client.rpc('upsert_contact',{
   _email:data.email,
   _full_name:data.full_name,
   _source:'adeziune',
   ...(data.phone?{_phone:data.phone}:{}),
   ...(data.county?{_county:data.county}:{}),
   ...(branchId?{_branch_id:branchId}:{}),
   // member_id nu se mai leagă aici: anonimii nu pot citi id-ul rândului inserat; legătura se face din admin la validare.
 });

 // Email de confirmare (double opt-in) din șablonul „confirmare-adeziune", editabil în admin.
 try {
   const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
   const { data: member } = await supabaseAdmin.from('members').select('confirm_token').eq('email', data.email).order('created_at', { ascending: false }).limit(1).maybeSingle();
   const { sendNamedTemplate, SITE_URL } = await import('./email.server');
   const link = member?.confirm_token ? `${SITE_URL}/confirmare-email?token=${member.confirm_token}` : SITE_URL;
   await sendNamedTemplate({ to: data.email, templateName: 'confirmare-adeziune', vars: { prenume: data.full_name.split(' ')[0] ?? '', nume: data.full_name, link_confirmare: link } });
 } catch { /* cererea rămâne înregistrată chiar dacă emailul nu pleacă */ }

 return {success:true};
});
