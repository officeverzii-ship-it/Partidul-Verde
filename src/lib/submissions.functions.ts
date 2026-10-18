import { createServerFn } from '@tanstack/react-start';
import { submissionSchema } from './submission-schema';
export const sendSubmission = createServerFn({ method: 'POST' })
 .inputValidator((input: unknown) => submissionSchema.parse(input))
 .handler(async ({ data }) => {
   const { createPublicBackendClient } = await import('./public-backend.server');
   const client = createPublicBackendClient();
   const { error } = await client.from('site_submissions').insert(data);
   if (error) throw new Error('Nu am putut înregistra cererea. Încearcă din nou.');
   return { success: true };
 });
