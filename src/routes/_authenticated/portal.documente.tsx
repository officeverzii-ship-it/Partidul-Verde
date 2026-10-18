import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/portal/documente")({
  head: () => pageHead("Documente și proceduri", "Documente interne ale Partidului Verde.", "/portal/documente"),
  component: Documents,
});

const STAFF: AppRole[] = ["admin_national", "admin_filiala", "editor"];

const minRoleLabels: Record<string, string> = {
  membru: "Toți membrii",
  staff: "Staff",
  admin: "Admini",
};

function Documents() {
  const { data: me } = useMyRoles();
  const isStaff = (me?.roles ?? []).some((r) => STAFF.includes(r));
  const qc = useQueryClient();
  const [kind, setKind] = useState("procedura");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [minRole, setMinRole] = useState("membru");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");

  const docs = useQuery({
    queryKey: ["portal-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portal_documents")
        .select("id, title, description, file_url, min_role, branch_id, created_at, branches(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const branches = useQuery({
    queryKey: ["branches-list"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("portal_documents").insert({
        title, kind,
        description: description || null,
        file_url: fileUrl,
        min_role: minRole,
        branch_id: branchId || null,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setDescription(""); setFileUrl(""); setError("");
      qc.invalidateQueries({ queryKey: ["portal-documents"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Eroare la salvare."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portal_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portal-documents"] }),
  });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Documente și proceduri</h2>

      {isStaff && (
        <form
          className="glass mt-6 grid gap-3 rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !fileUrl.trim()) { setError("Titlul și adresa fișierului sunt obligatorii."); return; }
            add.mutate();
          }}
        >
          <h3 className="font-semibold">Adaugă document sau anunț</h3>
          <select aria-label="Tip document" className="field" value={kind} onChange={e => setKind(e.target.value)}><option value="procedura">Procedură</option><option value="anunt">Anunț oficial</option></select>
          <input className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Titlu" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Descriere (opțional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <input className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Adresa fișierului (din Biblioteca media)" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
          <div className="flex flex-wrap gap-3">
            <label className="text-sm text-foreground/70">
              Vizibil pentru:{" "}
              <select className="rounded-lg border border-border bg-transparent px-2 py-1" value={minRole} onChange={(e) => setMinRole(e.target.value)}>
                <option value="membru">Toți membrii</option>
                <option value="staff">Staff</option>
                <option value="admin">Admini</option>
              </select>
            </label>
            <label className="text-sm text-foreground/70">
              Filială:{" "}
              <select className="rounded-lg border border-border bg-transparent px-2 py-1" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                <option value="">Toate filialele</option>
                {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </label>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={add.isPending} className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-semibold">
            {add.isPending ? "Se salvează…" : "Salvează documentul"}
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-3">
        {(docs.data ?? []).map((d) => (
          <div key={d.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
            <div>
              <a href={d.file_url} target="_blank" rel="noreferrer" className="font-semibold text-accent hover:underline">{d.title}</a>
              {d.description && <p className="mt-1 text-sm text-foreground/60">{d.description}</p>}
              <p className="mt-1 text-xs text-foreground/40">
                {minRoleLabels[d.min_role] ?? d.min_role}
                {d.branches?.name ? ` · ${d.branches.name}` : " · toate filialele"}
                {" · "}{new Date(d.created_at).toLocaleDateString("ro-RO")}
              </p>
            </div>
            {isStaff && (
              <button onClick={() => remove.mutate(d.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
                Șterge
              </button>
            )}
          </div>
        ))}
        {docs.data?.length === 0 && <p className="text-sm text-foreground/50">Nu există documente disponibile pentru tine încă.</p>}
      </div>
    </div>
  );
}
