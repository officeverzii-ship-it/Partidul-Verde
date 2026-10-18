import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";
import { sendTestEmail } from "@/lib/email.functions";

export const Route = createFileRoute("/_authenticated/admin/email-templates")({
  head: () => ({ meta: [{ title: "Șabloane email — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Tpl = { id: string; name: string; subject: string; body_html: string };

function Page() {
  const { data: me, isLoading } = useMyRoles();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Tpl | "new" | null>(null);
  const [testTo, setTestTo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Tpl[];
    },
  });

  const save = useMutation({
    mutationFn: async (v: { name: string; subject: string; body_html: string }) => {
      const res = editing && editing !== "new"
        ? await supabase.from("email_templates").update({ ...v, updated_at: new Date().toISOString() }).eq("id", editing.id)
        : await supabase.from("email_templates").insert(v);
      if (res.error) throw res.error;
    },
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["email-templates"] }); },
    onError: (e: Error) => setMsg(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-templates"] }),
  });

  const test = useMutation({
    mutationFn: async () => {
      if (!editing || editing === "new") throw new Error("Salvează mai întâi șablonul.");
      await sendTestEmail({ data: { templateId: editing.id, to: testTo } });
    },
    onSuccess: () => setMsg("Emailul de test a fost trimis."),
    onError: (e: Error) => setMsg(e.message),
  });

  if (!isLoading && me && !canAccess(me.roles, "email")) return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    save.mutate({
      name: String(fd.get("name") ?? "").trim(),
      subject: String(fd.get("subject") ?? "").trim(),
      body_html: String(fd.get("body_html") ?? ""),
    });
  };

  const cur = editing && editing !== "new" ? editing : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Șabloane de email</h1>
        <Button onClick={() => { setMsg(null); setEditing("new"); }} className="btn-brand px-4 py-2 text-sm">+ Șablon nou</Button>
      </div>
      <p className="mt-2 text-sm text-foreground/60">Variabile disponibile: {"{{prenume}}"}, {"{{nume}}"}, {"{{filiala}}"}. Footerul de dezabonare se adaugă automat.</p>

      {editing && (
        <form onSubmit={onSubmit} className="glass mt-5 grid gap-4 rounded-2xl p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Nume șablon *</span>
            <input name="name" required maxLength={120} className="field" defaultValue={cur?.name ?? ""} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Subiect *</span>
            <input name="subject" required maxLength={200} className="field" defaultValue={cur?.subject ?? ""} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Conținut HTML *</span>
            <textarea name="body_html" required rows={12} className="field font-mono text-xs" defaultValue={cur?.body_html ?? "<p>Bună, {{prenume}}!</p>\n<p>Scrie aici mesajul…</p>"} />
          </label>
          {cur && (
            <div>
              <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Previzualizare</span>
              <iframe title="previzualizare" sandbox="" srcDoc={cur.body_html} className="h-64 w-full rounded-lg border border-border bg-white" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={save.isPending} className="btn-brand px-5 py-2">Salvează</Button>
            <Button type="button" onClick={() => setEditing(null)} className="glass rounded-lg px-5 py-2">Anulează</Button>
            {cur && (
              <span className="flex items-center gap-2">
                <input className="field max-w-xs" type="email" placeholder="email@test.ro" value={testTo} onChange={(e) => setTestTo(e.currentTarget.value)} />
                <Button type="button" disabled={test.isPending || !testTo} onClick={() => { setMsg(null); test.mutate(); }} className="glass rounded-lg px-4 py-2">Trimite test</Button>
              </span>
            )}
          </div>
        </form>
      )}

      {msg && <p className="mt-4 text-sm text-accent">{msg}</p>}

      <div className="glass mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3">Nume</th><th className="px-4 py-3">Subiect</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.data?.map((t) => (
              <tr key={t.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">{t.name}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button onClick={() => { setMsg(null); setEditing(t); }} className="text-accent hover:underline">Editează</Button>
                  <Button onClick={() => confirm("Ștergi șablonul?") && remove.mutate(t.id)} className="ml-3 text-destructive hover:underline">Șterge</Button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-foreground/50">Niciun șablon.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
