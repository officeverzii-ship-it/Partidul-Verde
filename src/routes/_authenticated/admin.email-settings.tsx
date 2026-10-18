import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/email-settings")({
  head: () => ({ meta: [{ title: "Setări email — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { data: me, isLoading } = useMyRoles();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const settings = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "email").maybeSingle();
      return (data?.value ?? {}) as { from_name?: string; from_address?: string };
    },
  });

  const save = useMutation({
    mutationFn: async (v: { from_name: string; from_address: string }) => {
      const { error } = await supabase.from("site_settings").upsert({ key: "email", value: v, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { setMsg("Setările au fost salvate."); qc.invalidateQueries({ queryKey: ["email-settings"] }); },
    onError: (e: Error) => setMsg(e.message),
  });

  if (!isLoading && me && !canAccess(me.roles, "email")) return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    save.mutate({
      from_name: String(fd.get("from_name") ?? "").trim(),
      from_address: String(fd.get("from_address") ?? "").trim(),
    });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold">Setări email</h1>

      <form onSubmit={onSubmit} className="glass mt-5 grid gap-4 rounded-2xl p-6">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Nume expeditor</span>
          <input name="from_name" maxLength={80} className="field" defaultValue={settings.data?.from_name ?? "Partidul Verde"} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Adresă expeditor</span>
          <input name="from_address" type="email" maxLength={120} className="field" defaultValue={settings.data?.from_address ?? "onboarding@resend.dev"} />
        </label>
        <p className="text-xs text-foreground/50">Adresa trebuie să aparțină unui domeniu verificat în Resend. Până la verificare, emailurile de test ajung doar la adresa proprietarului contului Resend.</p>
        <div><Button disabled={save.isPending} className="btn-brand px-5 py-2">Salvează</Button></div>
        {msg && <p className="text-sm text-accent">{msg}</p>}
      </form>

      <div className="glass mt-6 rounded-2xl p-6 text-sm text-foreground/70">
        <h2 className="font-display text-xl font-bold text-foreground">Ajutor: autentificarea domeniului (SPF, DKIM, DMARC)</h2>
        <p className="mt-3">Pentru ca emailurile să ajungă în căsuța de primire (nu în Spam) și să poți trimite de pe propriul domeniu (ex. <em>newsletter@partidulverde.ro</em>), domeniul trebuie verificat în panoul Resend → Domains → Add Domain. Resend îți va arăta niște înregistrări DNS pe care le adaugi la furnizorul de DNS al domeniului:</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong>DKIM</strong> — o înregistrare TXT (uneori CNAME) care semnează digital fiecare email; dovedește că mesajul chiar vine de la domeniul tău și nu a fost modificat pe drum.</li>
          <li><strong>SPF</strong> — o înregistrare TXT care declară ce servere au voie să trimită emailuri în numele domeniului tău (Resend îți dă valoarea de inclus, de obicei <em>include:amazonses.com</em> sau similar).</li>
          <li><strong>DMARC</strong> — o înregistrare TXT la <em>_dmarc.domeniu.ro</em> care spune ce se întâmplă cu emailurile care nu trec SPF/DKIM (ex. <em>v=DMARC1; p=quarantine</em>) și unde primești rapoarte. Protejează împotriva uzurparii identității partidului.</li>
        </ul>
        <p className="mt-3">După ce adaugi înregistrările, revino în Resend și apasă „Verify” — propagarea DNS poate dura până la 72 de ore, de regulă câteva minute. Apoi setează aici adresa de expeditor pe domeniul verificat.</p>
      </div>
    </div>
  );
}
