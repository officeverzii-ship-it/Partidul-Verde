import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";
import { previewSegment } from "@/lib/email.functions";

export const Route = createFileRoute("/_authenticated/admin/segments")({
  head: () => ({ meta: [{ title: "Segmente — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Seg = { id: string; name: string; filters: Record<string, unknown> };

function filtersFrom(fd: FormData): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  for (const k of ["county", "source", "tag", "branch_id"] as const) {
    const v = String(fd.get(k) ?? "").trim();
    if (v) f[k] = v;
  }
  if (fd.get("newsletter_only") === "on") f["newsletter_only"] = true;
  return f;
}

function describe(f: Record<string, unknown>): string {
  const parts: string[] = [];
  if (f["county"]) parts.push(`județ: ${f["county"]}`);
  if (f["source"]) parts.push(`sursă: ${f["source"]}`);
  if (f["tag"]) parts.push(`tag: ${f["tag"]}`);
  if (f["newsletter_only"]) parts.push("doar abonați newsletter confirmați");
  return parts.length ? parts.join(", ") : "toate contactele";
}

function Page() {
  const { data: me, isLoading } = useMyRoles();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Seg | "new" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["email-segments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_segments").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Seg[];
    },
  });

  const save = useMutation({
    mutationFn: async (v: { name: string; filters: Record<string, unknown> }) => {
      const res = editing && editing !== "new"
        ? await supabase.from("email_segments").update(v as never).eq("id", editing.id)
        : await supabase.from("email_segments").insert(v as never);
      if (res.error) throw res.error;
    },
    onSuccess: () => { setEditing(null); qc.invalidateQueries({ queryKey: ["email-segments"] }); },
    onError: (e: Error) => alert(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_segments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email-segments"] }),
  });

  if (!isLoading && me && !canAccess(me.roles, "email")) return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({ name: String(fd.get("name") ?? "").trim(), filters: filtersFrom(fd) });
  };

  const onPreview = (e: FormEvent<HTMLFormElement>) => {
    const fd = new FormData(e.currentTarget);
    previewSegment({ data: { filters: filtersFrom(fd) } })
      .then((r) => setPreview(`${r.count} contacte în segment${r.sample.length ? ` — ex.: ${r.sample.map((s) => s.email).join(", ")}` : ""}`))
      .catch((err: Error) => setPreview(err.message));
  };

  const cur = editing && editing !== "new" ? editing : null;
  const cf = cur?.filters ?? {};

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Segmente</h1>
        <Button onClick={() => { setPreview(null); setEditing("new"); }} className="btn-brand px-4 py-2 text-sm">+ Segment nou</Button>
      </div>

      {editing && (
        <form onSubmit={onSubmit} onChange={onPreview} className="glass mt-5 grid gap-4 rounded-2xl p-6 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Nume *</span>
            <input name="name" required maxLength={120} className="field" defaultValue={cur?.name ?? ""} placeholder="ex. Membri aprobați din București" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Județ</span>
            <input name="county" maxLength={50} className="field" defaultValue={String(cf["county"] ?? "")} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Sursă</span>
            <input name="source" maxLength={50} className="field" defaultValue={String(cf["source"] ?? "")} placeholder="adeziune / voluntar / newsletter…" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">Tag</span>
            <input name="tag" maxLength={50} className="field" defaultValue={String(cf["tag"] ?? "")} />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="newsletter_only" defaultChecked={!!cf["newsletter_only"]} />
            <span className="text-sm">Doar abonați la newsletter cu dublă confirmare</span>
          </label>
          {preview && <p className="text-sm text-accent sm:col-span-2">{preview}</p>}
          <div className="flex gap-3 sm:col-span-2">
            <Button disabled={save.isPending} className="btn-brand px-5 py-2">Salvează</Button>
            <Button type="button" onClick={() => setEditing(null)} className="glass rounded-lg px-5 py-2">Anulează</Button>
          </div>
        </form>
      )}

      <div className="glass mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3">Nume</th><th className="px-4 py-3">Filtre</th><th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.data?.map((s) => (
              <tr key={s.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-foreground/60">{describe(s.filters)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button onClick={() => { setPreview(null); setEditing(s); }} className="text-accent hover:underline">Editează</Button>
                  <Button onClick={() => confirm("Ștergi segmentul?") && remove.mutate(s.id)} className="ml-3 text-destructive hover:underline">Șterge</Button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-foreground/50">Niciun segment.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
