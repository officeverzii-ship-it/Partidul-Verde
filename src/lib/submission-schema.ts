import { z } from 'zod';
export const submissionSchema = z.object({
  kind: z.enum(['contact', 'newsletter']),
  full_name: z.string().trim().min(2, 'Completează numele.').max(100),
  email: z.string().trim().email('Adresa de email nu este validă.').max(255),
  message: z.string().trim().max(2000).default(''),
  consent: z.literal(true, { errorMap: () => ({ message: 'Este necesar acordul privind prelucrarea datelor.' }) }),
}).superRefine((v, ctx) => {
  if (v.kind === 'contact' && v.message.length < 10) ctx.addIssue({ code: 'custom', path: ['message'], message: 'Mesajul trebuie să conțină minimum 10 caractere.' });
  if (v.kind === 'newsletter' && v.message !== '') ctx.addIssue({ code: 'custom', path: ['message'], message: 'Date de abonare nevalide.' });
});
