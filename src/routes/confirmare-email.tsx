import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { Layout, PageHeader } from '@/components/site/Layout';
import { confirmMembershipEmail } from '@/lib/crm.functions';

const searchSchema = z.object({ token: z.string().uuid().optional() });

export const Route = createFileRoute('/confirmare-email')({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: 'Confirmare email — Partidul Verde' },
      { name: 'description', content: 'Confirmarea adresei de email pentru cererea de adeziune la Partidul Verde.' },
      { name: 'robots', content: 'noindex' },
    ],
  }),
  component: ConfirmareEmail,
});

function ConfirmareEmail() {
  const { token } = Route.useSearch();
  const confirm = useServerFn(confirmMembershipEmail);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }
    confirm({ data: { token } })
      .then(() => setState('ok'))
      .catch(() => setState('error'));
    // Confirmarea se rulează o singură dată la încărcarea paginii.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Layout>
      <PageHeader eyebrow="Partidul Verde" title="Confirmare email" />
      <section className="content-width py-10">
        {state === 'loading' && <p>Se confirmă adresa ta de email…</p>}
        {state === 'ok' && (
          <div role="status" className="border-l-4 border-brand p-5">
            <h2 className="text-2xl font-bold">Adresa de email a fost confirmată.</h2>
            <p className="mt-3">Cererea ta de adeziune ajunge acum la validare. Un reprezentant al Partidului Verde te va contacta.</p>
          </div>
        )}
        {state === 'error' && (
          <div role="alert" className="border-l-4 border-destructive p-5">
            <h2 className="text-2xl font-bold">Linkul de confirmare este invalid sau a expirat.</h2>
            <p className="mt-3">Trimite din nou cererea de adeziune sau contactează secretariatul partidului.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}
