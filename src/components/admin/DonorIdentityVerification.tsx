import { useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isAdultCnp, isValidCnp } from '@/lib/cnp';
import { Button } from '@/components/ui/button';

export function DonorIdentityVerification() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const cnp = String(fields.get('cnp') ?? '').trim();
    if (!isValidCnp(cnp) || !isAdultCnp(cnp)) { setMessage('Introdu un CNP valid pentru un donator major.'); return; }
    setBusy(true);
    try {
      const result = await supabase.rpc('admin_verify_donor_identity', { _email: String(fields.get('email')).trim(), _cnp: cnp, _remove: fields.get('action') === 'remove' });
      setMessage(result.error ? 'Verificarea nu a putut fi salvată. Verifică dacă există un cont cu email confirmat.' : 'Verificarea identității a fost actualizată.');
      if (!result.error) form.reset();
    } finally { setBusy(false); }
  }
  return <section className="mt-10 border-t border-border pt-6">
    <h2 className="text-xl font-bold">Identitatea donatorilor</h2>
    <p className="mt-2 text-sm text-muted-foreground">Confirmă identitatea persoanei prin procedura organizației înainte de a asocia CNP-ul contului. Emailul confirmat, singur, nu dovedește identitatea.</p>
    <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
      <label>Email cont confirmat<input name="email" type="email" required maxLength={255} className="field mt-2" /></label>
      <label>CNP verificat<input name="cnp" required pattern="[1-9][0-9]{12}" maxLength={13} autoComplete="off" className="field mt-2" /></label>
      <label>Acțiune<select name="action" className="field mt-2"><option value="verify">Confirmă identitatea verificată</option><option value="remove">Retrage verificarea</option></select></label>
      <div className="flex items-end"><Button disabled={busy}>Salvează verificarea</Button></div>
    </form>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}