import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { submissionSchema } from './submission-schema';
export const sendSubmission = createServerFn({ method: 'POST' })
 .inputValidator((input: unknown) => submissionSchema.parse(input))
 .handler(async ({ data }) => {
   const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
   if (!url || !key) throw new Error('Serviciul de mesaje nu este configurat.');
   const client = createClient<Database>(url, key, { auth: { persistSession: false }, global: { fetch: (input, init) => {
     const h = new Headers(init?.headers); if (key.startsWith('sb_') && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization'); h.set('apikey',key); return fetch(input,{...init,headers:h});
   } } });
   const { error } = await client.from('site_submissions').insert(data);
   if (error) throw new Error('Nu am putut înregistra cererea. Încearcă din nou.');
   return { success: true };
 });
