// Trimitere emailuri prin conexiunea Resend (gateway Lovable). Doar server-side.
import { createPublicBackendClient } from './public-backend.server';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';
// Linkurile din emailuri duc mereu la site-ul public principal (nu la copia de rezervă).
export const SITE_URL = (import.meta.env['VITE_SITE_URL'] as string | undefined) || 'https://partidulverde.duckdns.org';

export type EmailSettings = { from_name: string; from_address: string };
const DEFAULT_FROM: EmailSettings = { from_name: 'Partidul Verde', from_address: 'onboarding@resend.dev' };

type Client = ReturnType<typeof createPublicBackendClient>;

export async function getEmailSettings(client: Client): Promise<EmailSettings> {
  const { data } = await client.from('site_settings').select('value').eq('key', 'email').maybeSingle();
  const v = (data?.value ?? {}) as Partial<EmailSettings>;
  return { from_name: v.from_name || DEFAULT_FROM.from_name, from_address: v.from_address || DEFAULT_FROM.from_address };
}

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (_, k: string) => vars[k] ?? '');
}

export async function isSuppressed(client: Client, email: string): Promise<boolean> {
  const { data } = await client.from('email_suppressions').select('id').eq('email', email.toLowerCase()).maybeSingle();
  return !!data;
}

export async function sendEmail(client: Client, params: { to: string; subject: string; html: string }) {
  const lovKey = process.env['LOVABLE_API_KEY'];
  const resendKey = process.env['RESEND_API_KEY'];
  if (!lovKey || !resendKey) throw new Error('Conexiunea Resend nu este configurată.');
  const from = await getEmailSettings(client);
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${lovKey}`,
      'X-Connection-Api-Key': resendKey,
    },
    body: JSON.stringify({ from: `${from.from_name} <${from.from_address}>`, to: [params.to], subject: params.subject, html: params.html }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Trimiterea a eșuat [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? null };
}

/** Trimite un email tranzacțional pe baza unui șablon din Admin → Șabloane email (căutat după nume). */
export async function sendNamedTemplate(opts: { to: string; templateName: string; vars: Record<string, string> }) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data: tpl } = await supabaseAdmin.from('email_templates').select('subject, body_html').eq('name', opts.templateName).maybeSingle();
  if (!tpl) return { sent: false as const, reason: 'no_template' as const };
  const { sendTransactional } = await import('./email.functions');
  return sendTransactional(supabaseAdmin as never, {
    to: opts.to,
    subject: renderTemplate(tpl.subject, opts.vars),
    html: renderTemplate(tpl.body_html, opts.vars),
    templateName: opts.templateName,
  });
}

/** Footer de dezabonare obligatoriu pentru emailurile comerciale. */
export function withUnsubscribeFooter(html: string, token: string | null): string {
  const url = token ? `${SITE_URL}/dezabonare?token=${token}` : `${SITE_URL}/dezabonare`;
  return `${html}<hr style="margin-top:32px;border:none;border-top:1px solid #ddd"/><p style="font-size:12px;color:#666">Primești acest email deoarece te-ai abonat la comunicările Partidului Verde. <a href="${url}">Dezabonare cu un click</a>.</p>`;
}
