import { createFileRoute } from '@tanstack/react-router';

// Webhook Resend: actualizează statusurile mesajelor (livrat, deschis, click, bounce, plângere)
// și alimentează lista de suprimare pentru bounce-uri și plângeri.
export const Route = createFileRoute('/api/public/resend/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let event: { type?: string; data?: { email_id?: string; to?: string[] } };
        try {
          event = await request.json();
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
          const addr = (msg as { email?: string } | null)?.email ?? event.data?.to?.[0];
          if (addr) {
            await supabaseAdmin.from('email_suppressions').upsert({ email: addr.toLowerCase(), reason: status } as never, { onConflict: 'email' });
          }
        }
        return Response.json({ ok: true });
      },
    },
  },
});
