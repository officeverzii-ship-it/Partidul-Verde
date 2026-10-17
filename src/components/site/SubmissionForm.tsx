import { useState, type FormEvent } from 'react';
import { Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Send, CheckCircle2, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from './Form';
import { submissionSchema } from '@/lib/submission-schema';
import { sendSubmission } from '@/lib/submissions.functions';
export function SubmissionForm({ kind }: { kind: 'contact' | 'newsletter' }) {
 const send = useServerFn(sendSubmission);
 const [busy,setBusy] = useState(false); const [error,setError] = useState(''); const [sent,setSent] = useState(false);
 async function submit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault(); if (busy) return;
  const fd = new FormData(e.currentTarget);
  const parsed = submissionSchema.safeParse({kind,full_name:fd.get('full_name'),email:fd.get('email'),message:kind==='contact'?fd.get('message'):'',consent:fd.get('consent')==='on'});
  if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Verifică datele.'); return; }
  setBusy(true);setError('');
  try { await send({data:parsed.data});setSent(true); } catch(e) {setError(e instanceof Error?e.message:'Cererea nu a putut fi înregistrată.');} finally {setBusy(false);}
 }
 if(sent) return <div role="status" className="border-l-4 border-brand bg-secondary p-6"><CheckCircle2 className="mb-3 size-7 text-brand"/><h2 className="text-xl font-bold">{kind==='contact'?'Mesajul a fost înregistrat.':'Abonarea a fost înregistrată.'}</h2><p className="mt-2 text-muted-foreground">{kind==='contact'?'Mulțumim că ne-ai scris.':'Mulțumim pentru interesul acordat Partidului Verde.'}</p></div>;
 return <form onSubmit={submit} className="space-y-5">
  <Field label="Nume complet *"><input name="full_name" required minLength={2} maxLength={100} autoComplete="name" className="field"/></Field>
  <Field label="Email *"><input name="email" type="email" required maxLength={255} autoComplete="email" className="field"/></Field>
  {kind==='contact'&&<Field label="Mesaj *"><textarea name="message" required minLength={10} maxLength={2000} rows={6} className="field"/></Field>}
  <label className="flex items-start gap-3 text-sm leading-relaxed"><input name="consent" type="checkbox" required className="mt-1 size-4 accent-brand"/><span>{kind==='contact'?'Sunt de acord cu prelucrarea datelor pentru soluționarea mesajului.':'Sunt de acord cu prelucrarea datelor pentru abonarea la newsletter.'} <Link to="/confidentialitate" className="text-brand underline">Politica de confidențialitate</Link></span></label>
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  <Button disabled={busy} type="submit" size="lg">{busy?<LoaderCircle className="animate-spin"/>:<Send/>}{busy?'Se înregistrează…':kind==='contact'?'Trimite mesajul':'Abonează-te'}</Button>
 </form>;
}
