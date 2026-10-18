import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";
import { campaignStats, sendCampaignBatch } from "@/lib/email.functions";

export const Route = createFileRoute("/_authenticated/admin/campaigns")({
  head: () => ({ meta: [{ title: "Campanii email — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Campaign = { id: string; name: string; status: string; scheduled_at: string | null; sent_count: number; template_id: string | null; segment_id: string | null; created_at: string };

const statusLabels: Record<string, string> = { ciorna: "Ciornă", programata: "Programată", in_curs: "În curs de trimitere", trimisa: "Trimisă" };

function Page() {
  const { data: me, isLoading } = useMyRoles();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [statsFor, setStatsFor] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });
  const templates = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => (await supabase.from("email_templates").select("id, name")).data ?? [],
  });
  const segments = useQuery({
    queryKey: ["email-segments"],
    queryFn: async () => (await supabase.from("email_segments").select("id, name")).data ?? [],
  });
  const stats = useQuery({
    queryKey: ["campaign-stats", statsFor],
    enabled: !!statsFor,
    queryFn: () => campaignStats({ data: { campaignId: statsFor! } }),
  });

  const create = useMutation({
    mutationFn: async (v: Record<string, unknown>) => {
      const { error } = await supabase.from("email_campaigns").insert(v as never);
      if (error) throw error;
    },
    onSuccess: () => { setCreating(false); qc.invalidateQueries({ queryKey: ["email-campaigns"] }); },
    onError: (e: Error) => setMsg(e.message),
  });

  const send = useMutation({
    mutationFn: async (id: string) => {
      // Trimite în loturi până la finalizare (rate limit pe lot).
      for (;;) {
        const r = await sendCampaignBatch({ data: { campaignId: id } });
        setMsg(`Trimise ${r.sent}, sărite (dezabonate) ${r.skipped}, rămase ${r.remaining}…`);
        if (r.done) return r;
      }
    },
    onSuccess: (r) => { setMsg(`Campania a fost trimisă complet: ${r.sent} emailuri în ultimul lot, ${r.skipped} sărite.`); qc.invalidateQueries({ queryKey: ["email-campaigns"] }); },
    onError: (e: Error) => setMsg(e.message),
  });

  if (!isLoading && me && !canAccess(me.roles, "email")) return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const sched = String(fd.get("scheduled_at") ?? "");
    create.mutate({
      name: String(fd.get("name") ?? "").trim(),
      template_id: String(fd.get("template_id") ?? "") || null,
      segment_id: String(fd.get("segment_id") ?? "") || null,
      scheduled_at: sched ? new Date(sched).toISOString() : null,
      status: sched ? "programata" : "ciorna",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Campanii email</h1>
        <Button onClick={() => setCreating(true)} className="btn-brand px-4 py-2 text-sm">+ Campanie nouă</Button>
      </div>
      <p className="mt-2 text-sm text-foreground/60">Trimiterea se face în loturi; contactele dezabonate sau cu bounce sunt sărite automat. Fiecare email include link de dezabonare.</p>

      {creating && (
        <form onSubmit={onSubmit} className="glass mt-5 grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Nume campanie *</span>
            <input name="name" required maxLength={120} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Șablon *</span>
            <select name="template_id" required className="field">
              <option value="">— alege —</option>
              {templates.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Segment *</span>
            <select name="segment_id" required className="field">
              <option value="">— alege —</option>
              {segments.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Programează (opțional)</span>
            <input name="scheduled_at" type="datetime-local" className="field" />
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button disabled={create.isPending} className="btn-brand px-5 py-2">Creează</Button>
            <Button type="button" onClick={() => setCreating(false)} className="glass rounded-lg px-5 py-2">Anulează</Button>
          </div>
        </form>
      )}

      {msg && <p className="mt-4 text-sm text-accent">{msg}</p>}

      <div className="glass mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3">Nume</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Trimise</th><th className="px-4 py-3">Programată</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.data?.map((c) => (
              <tr key={c.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{statusLabels[c.status] ?? c.status}</td>
                <td className="px-4 py-3">{c.sent_count}</td>
                <td className="px-4 py-3">{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString("ro-RO") : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {c.status !== "trimisa" && (
                    <Button disabled={send.isPending} onClick={() => { setMsg(null); send.mutate(c.id); }} className="text-accent hover:underline">
                      {c.status === "in_curs" ? "Continuă trimiterea" : "Trimite acum"}
                    </Button>
                  )}
                  <Button onClick={() => setStatsFor(statsFor === c.id ? null : c.id)} className="ml-3 text-accent hover:underline">Statistici</Button>
                  {statsFor === c.id && stats.data && (
                    <div className="mt-1 text-left text-xs text-foreground/60">
                      {Object.entries(stats.data).map(([k, v]) => <div key={k}>{k}: {v}</div>)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-foreground/50">Nicio campanie.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
