import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { verifyResendSignature } from '@/lib/resend-signature.server';

// Webhook Resend: actualizează statusurile mesajelor (livrat, deschis, click, bounce, plângere)
// și alimentează lista de suprimare pentru bounce-uri și plângeri.
export const Route = createFileRoute('/api/public/resend/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env['RESEND_WEBHOOK_SECRET'];
        if (!secret) return Response.json({ error: 'Webhook indisponibil' }, { status: 503 });
        const rawBody = await request.text();
        if (!await verifyResendSignature(rawBody, request.headers, secret)) {
          return Response.json({ error: 'Semnătură invalidă' }, { status: 401 });
        }
        const eventSchema = z.object({ type: z.string().max(80), data: z.object({ email_id: z.string().min(1).max(255), to: z.array(z.string().email()).max(100).optional() }) });
        let event: z.infer<typeof eventSchema>;
        try {
          event = eventSchema.parse(JSON.parse(rawBody));
        } catch {
          return Response.json({ error: 'invalid json' }, { status: 400 });
        }
        const type = event.type ?? '';
        const emailId = event.data?.email_id;
        if (!emailId) return Response.json({ ok: true });

        const statusMap: Record<string, string> = {
          'email.delivered': 'delivered',
          'email.opened': 'opened',
          'email.clicked': 'clicked',
          'email.bounced': 'bounced',
          'email.complained': 'complained',
        };
        const status = statusMap[type];
        if (!status) return Response.json({ ok: true });

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
        await supabaseAdmin.from('email_messages').update({ status, updated_at: new Date().toISOString() } as never).eq('resend_id', emailId);

        if (status === 'bounced' || status === 'complained') {
          const { data: msg } = await supabaseAdmin.from('email_messages').select('email').eq('resend_id', emailId).maybeSingle();
          const addr = (msg as { email?: string } | null)?.email;
          if (addr) {
            await supabaseAdmin.from('email_suppressions').upsert({ email: addr.toLowerCase(), reason: status } as never, { onConflict: 'email' });
          }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
