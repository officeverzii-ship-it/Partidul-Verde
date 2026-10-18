import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { createPublicBackendClient } from './public-backend.server';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { escapeHtml } from './output-safety';

type Client = ReturnType<typeof createPublicBackendClient>;

async function requireStaff(context: { supabase: any; userId: string }) {
  const { data: isAdmin } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin_national' });
  const { data: isEditor } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'editor' });
  if (!isAdmin && !isEditor) throw new Error('Acces interzis');
}

async function audit(client: any, userId: string, action: string, table: string, recordId: string | null, detail: string) {
  await client.from('audit_log').insert({ user_id: userId, action, table_name: table, record_id: recordId, ip_address: detail.slice(0, 500) } as never);
}

async function adminClient() {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as Client;
}

type ContactRow = { id: string; email: string; full_name: string; county: string | null; source: string; tags: string[]; newsletter_confirmed: boolean; unsubscribe_token: string | null; branch_id: string | null };

async function resolveSegment(client: Client, filters: Record<string, unknown>): Promise<ContactRow[]> {
  let q = client.from('contacts').select('id, email, full_name, county, source, tags, newsletter_confirmed, unsubscribe_token, branch_id');
  if (filters["county"]) q = q.eq('county', String(filters["county"]));
  if (filters["source"]) q = q.eq('source', String(filters["source"]));
  if (filters["branch_id"]) q = q.eq('branch_id', String(filters["branch_id"]));
  if (filters["newsletter_only"]) q = q.eq('newsletter_confirmed', true);
  if (filters["tag"]) q = q.contains('tags', [String(filters["tag"])]);
  const { data, error } = await q.limit(5000);
  if (error) throw new Error('Nu am putut citi segmentul.');
  return (data ?? []) as unknown as ContactRow[];
}

export const previewSegment = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ filters: z.record(z.string(), z.unknown()) }).parse(v))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const contacts = await resolveSegment(createPublicBackendClient(), data.filters);
    return { count: contacts.length, sample: contacts.slice(0, 10).map((c) => ({ email: c.email, full_name: c.full_name })) };
  });

export const sendTestEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ templateId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const { data: { user }, error: userError } = await context.supabase.auth.getUser();
    if (userError || !user?.email || !user.email_confirmed_at) throw new Error('Confirmă adresa contului înainte de a trimite teste.');
    const client = context.supabase;
    const { data: tpl } = await client.from('email_templates').select('*').eq('id', data.templateId).single();
    if (!tpl) throw new Error('Șablonul nu există.');
    const { renderTemplate, sendEmail } = await import('./email.server');
    const html = renderTemplate(tpl.body_html, { prenume: 'Test', filiala: 'București', nume: 'Utilizator Test' });
    await sendEmail(client, { to: user.email, subject: `[TEST] ${tpl.subject}`, html });
    return { sent: true };
  });

const BATCH = 20;

export const sendCampaignBatch = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ campaignId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const client = createPublicBackendClient();
    const admin = await adminClient();
    const { data: campaign } = await client.from('email_campaigns').select('*').eq('id', data.campaignId).single();
    if (!campaign) throw new Error('Campania nu există.');
    if (!campaign.template_id || !campaign.segment_id) throw new Error('Campania are nevoie de șablon și segment.');
    const { data: tpl } = await client.from('email_templates').select('*').eq('id', campaign.template_id).single();
    const { data: seg } = await client.from('email_segments').select('*').eq('id', campaign.segment_id).single();
    if (!tpl || !seg) throw new Error('Șablonul sau segmentul lipsește.');

    const { isSuppressed, renderTemplate, sendEmail, withUnsubscribeFooter } = await import('./email.server');
    const all = await resolveSegment(admin, (seg.filters ?? {}) as Record<string, unknown>);
    const alreadySent = new Set(
      (((await admin.from('email_messages').select('email').eq('campaign_id', campaign.id)).data) ?? []).map((m: { email: string }) => m.email),
    );
    const queue = all.filter((c) => !alreadySent.has(c.email));
    const batch = queue.slice(0, BATCH);

    let sent = 0;
    let skipped = 0;
    for (const c of batch) {
      if (await isSuppressed(admin, c.email)) {
        skipped++;
        await admin.from('email_messages').insert({ campaign_id: campaign.id, contact_id: c.id, email: c.email, subject: tpl.subject, template_name: tpl.name, status: 'suppressed' } as never);
        continue;
      }
      const vars = { prenume: c.full_name.split(' ')[0] ?? '', nume: c.full_name, filiala: c.county ?? '' };
      const html = withUnsubscribeFooter(renderTemplate(tpl.body_html, vars), c.unsubscribe_token);
      try {
        const res = await sendEmail(client, { to: c.email, subject: renderTemplate(tpl.subject, vars), html });
        await admin.from('email_messages').insert({ campaign_id: campaign.id, contact_id: c.id, email: c.email, subject: tpl.subject, template_name: tpl.name, status: 'sent', resend_id: res.id } as never);
        sent++;
      } catch (e) {
        await admin.from('email_messages').insert({ campaign_id: campaign.id, contact_id: c.id, email: c.email, subject: tpl.subject, template_name: tpl.name, status: 'error', error: e instanceof Error ? e.message : 'eroare' } as never);
      }
    }

    const remaining = queue.length - batch.length;
    const done = remaining <= 0;
    await admin.from('email_campaigns').update({ status: done ? 'trimisa' : 'in_curs', sent_count: campaign.sent_count + sent } as never).eq('id', campaign.id);
    await audit(admin, (context as { userId: string }).userId, 'campaign_batch', 'email_campaigns', campaign.id, `trimise=${sent} sarite=${skipped} ramase=${Math.max(0, remaining)}`);
    return { sent, skipped, remaining: Math.max(0, remaining), done };
  });

export const campaignStats = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ campaignId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const client = createPublicBackendClient();
    const { data: rows } = await client.from('email_messages').select('status').eq('campaign_id', data.campaignId);
    const stats: Record<string, number> = {};
    for (const r of rows ?? []) stats[r.status] = (stats[r.status] ?? 0) + 1;
    return stats;
  });

/** Abonare newsletter publică cu double opt-in. */
export const subscribeNewsletter = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) =>
    z.object({
      full_name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(255),
      consent: z.boolean().refine((x) => x === true, 'Consimțământul este obligatoriu.'),
    }).parse(v),
  )
  .handler(async ({ data }) => {
    const client = createPublicBackendClient();
    await client.rpc('upsert_contact', { _email: data.email, _full_name: data.full_name, _source: 'newsletter' });
    // Token issuance is server-only; never expose pending confirmation tokens through public RPCs.
    const admin = await adminClient();
    const { data: token, error } = await admin.rpc('start_newsletter_signup', { _email: data.email });
    if (error) throw new Error('Nu am putut înregistra abonarea. Încearcă din nou.');
    if (!token) return { success: true };
    const { sendEmail, SITE_URL } = await import('./email.server');
    const url = `${SITE_URL}/confirmare-newsletter?token=${token}`;
    await sendEmail(client, {
      to: data.email,
      subject: 'Confirmă abonarea la newsletterul Partidului Verde',
      html: `<p>Bună, ${escapeHtml(data.full_name)}!</p><p>Apasă pe linkul de mai jos pentru a confirma abonarea la newsletter:</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p><p>Dacă nu ai cerut această abonare, ignoră acest mesaj.</p>`,
    });
    return { success: true };
  });

/** Confirmare newsletter prin token (double opt-in). */
export const confirmNewsletterToken = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => z.object({ token: z.string().uuid() }).parse(v))
  .handler(async ({ data }) => {
    const client = createPublicBackendClient();
    const { data: ok } = await client.rpc('confirm_newsletter', { _token: data.token });
    if (!ok) throw new Error('Linkul de confirmare este invalid sau a expirat.');
    return { success: true };
  });

/** Dezabonare publică prin token. */
export const unsubscribeByToken = createServerFn({ method: 'POST' })
  .inputValidator((v: unknown) => z.object({ token: z.string().uuid() }).parse(v))
  .handler(async ({ data }) => {
    const client = createPublicBackendClient();
    const { data: ok } = await client.rpc('unsubscribe_email', { _token: data.token });
    if (!ok) throw new Error('Linkul de dezabonare este invalid.');
    return { success: true };
  });

/** Istoric emailuri pentru un contact (fișa contactului). */
export const contactEmailHistory = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ contactId: z.string().uuid() }).parse(v))
  .handler(async ({ data, context }) => {
    await requireStaff(context as never);
    const client = createPublicBackendClient();
    const { data: rows } = await client.from('email_messages').select('id, subject, template_name, status, created_at').eq('contact_id', data.contactId).order('created_at', { ascending: false }).limit(100);
    return rows ?? [];
  });

/** Email tranzacțional generic (folosit intern de alte fluxuri). */
export async function sendTransactional(client: Client, opts: { to: string; contactId?: string | null; subject: string; html: string; templateName: string }) {
  const { isSuppressed, sendEmail } = await import('./email.server');
  if (await isSuppressed(client, opts.to)) return { sent: false as const, reason: 'suppressed' as const };
  try {
    const res = await sendEmail(client, { to: opts.to, subject: opts.subject, html: opts.html });
    await client.from('email_messages').insert({ contact_id: opts.contactId ?? null, email: opts.to, subject: opts.subject, template_name: opts.templateName, status: 'sent', resend_id: res.id } as never);
    return { sent: true as const };
  } catch (e) {
    await client.from('email_messages').insert({ contact_id: opts.contactId ?? null, email: opts.to, subject: opts.subject, template_name: opts.templateName, status: 'error', error: e instanceof Error ? e.message : 'eroare' } as never);
    return { sent: false as const, reason: 'error' as const };
  }
}
