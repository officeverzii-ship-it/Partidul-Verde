import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { escapeHtml } from './output-safety';

const email = z.string().trim().email('Email invalid').max(255);
const name = z.string().trim().min(2, 'Numele este prea scurt').max(100);

const volunteerSchema = z.object({
  full_name: name,
  email,
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  availability: z.string().trim().max(50).optional().or(z.literal('')),
  skills: z.string().trim().max(500).optional().or(z.literal('')),
  branch_id: z.string().uuid().optional().or(z.literal('')),
  county: z.string().trim().max(50).optional().or(z.literal('')),
  gdpr_consent: z.boolean().refine((v) => v === true, 'Consimțământul GDPR este obligatoriu.'),
});

const registrationSchema = z.object({
  event_id: z.string().uuid(),
  full_name: name,
  email,
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  gdpr_consent: z.boolean().refine((v) => v === true, 'Consimțământul GDPR este obligatoriu.'),
});

const contactSchema = z.object({
  full_name: name,
  email,
  message: z.string().trim().min(10, 'Mesajul trebuie să aibă cel puțin 10 caractere.').max(2000),
  consent: z.boolean().refine((v) => v === true, 'Consimțământul este obligatoriu.'),
});

type BackendClient = Awaited<ReturnType<typeof getClient>>;
async function getClient() {
  const { createPublicBackendClient } = await import('./public-backend.server');
  return createPublicBackendClient();
}

/** Creează sau actualizează contactul CRM după email (deduplicare). */
async function upsertContact(
  client: BackendClient,
  data: { email: string; full_name: string; phone?: string | null; county?: string | null; source: string; branch_id?: string | null; member_id?: string | null },
) {
  // Public submissions may create new contacts, never overwrite an existing email match.
  const { data: id, error } = await client.rpc('upsert_contact', {
    _email: data.email,
    _full_name: data.full_name,
    _source: data.source,
    ...(data.phone ? { _phone: data.phone } : {}),
    ...(data.county ? { _county: data.county } : {}),
    ...(data.branch_id ? { _branch_id: data.branch_id } : {}),
    ...(data.member_id ? { _member_id: data.member_id } : {}),
  });
  if (error) throw new Error('Nu am putut înregistra datele de contact. Încearcă din nou.');
  return (id as string | null) ?? null;
}

async function queueConfirmationEmail(client: BackendClient, to: string, subject: string, body: string) {
  // Tranzacțional: se trimite efectiv prin Resend; rezultatul se jurnalizează în email_messages.
  const { sendTransactional } = await import('./email.functions');
  await sendTransactional(client, { to, subject, html: `<p>${escapeHtml(body)}</p>`, templateName: 'confirmare-formular' });
}

export const submitVolunteer = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => volunteerSchema.parse(v))
  .handler(async ({ data }) => {
    const client = await getClient();
    const { error } = await client.from('volunteers').insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      availability: data.availability || null,
      skills: data.skills || null,
      branch_id: data.branch_id || null,
      status: 'nou',
    });
    if (error) throw new Error('Nu am putut trimite formularul. Încearcă din nou.');
    await upsertContact(client, { email: data.email, full_name: data.full_name, phone: data.phone || null, county: data.county || null, source: 'voluntar', branch_id: data.branch_id || null });
    await queueConfirmationEmail(client, data.email, 'Confirmare înscriere voluntar', `Bună, ${data.full_name}! Am primit cererea ta de voluntariat.`);
    return { success: true };
  });

export const submitEventRegistration = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => registrationSchema.parse(v))
  .handler(async ({ data }) => {
    const client = await getClient();
    const { error } = await client.from('event_registrations').insert({
      event_id: data.event_id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      gdpr_consent: true,
      status: 'nou',
    });
    if (error) throw new Error('Nu am putut înregistra înscrierea. Încearcă din nou.');
    await upsertContact(client, { email: data.email, full_name: data.full_name, phone: data.phone || null, source: 'eveniment' });
    await queueConfirmationEmail(client, data.email, 'Confirmare înscriere eveniment', `Bună, ${data.full_name}! Înscrierea ta a fost înregistrată.`);
    return { success: true };
  });

export const submitContactMessage = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => contactSchema.parse(v))
  .handler(async ({ data }) => {
    const client = await getClient();
    const { error } = await client.from('site_submissions').insert({
      kind: 'contact',
      full_name: data.full_name,
      email: data.email,
      message: data.message,
      consent: true,
      status: 'nou',
    });
    if (error) throw new Error('Nu am putut trimite mesajul. Încearcă din nou.');
    await upsertContact(client, { email: data.email, full_name: data.full_name, source: 'contact' });
    return { success: true };
  });

/** Confirmare email (double opt-in) pentru cererile de adeziune. */
export const confirmMembershipEmail = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => z.object({ token: z.string().uuid() }).parse(v))
  .handler(async ({ data }) => {
    const client = await getClient();
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id, email_confirmed')
      .eq('confirm_token', data.token)
      .maybeSingle();
    if (!member) throw new Error('Linkul de confirmare este invalid sau a expirat.');
    if (!member.email_confirmed) {
      await supabaseAdmin.from('members').update({ email_confirmed: true }).eq('id', member.id);
    }
    return { success: true };
  });
