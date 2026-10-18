import { Button } from "@/components/ui/button";
import { forumCategories } from "@/lib/module-rules";
import { MessageSquare, Lock, Plus } from "lucide-react";
import { pageHead } from "@/lib/seo";
import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portal/forum")({
  head: () => pageHead("Forum intern", "Discuții interne între membrii Partidului Verde.", "/portal/forum"),
  component: Forum,
});

function Forum() {
  const params = useParams({ strict: false }) as { threadId?: string };
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [filter, setFilter] = useState("");
  const [scope, setScope] = useState("national");
  const [error, setError] = useState("");

  const threads = useQuery({
    queryKey: ["forum-threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_threads")
        .select("id, title, author_id, locked, created_at, category, branch_id")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const counts = useQuery({
    queryKey: ["forum-post-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("forum_posts").select("thread_id");
      if (error) throw error;
      const map = new Map<string, number>();
      for (const p of data ?? []) map.set(p.thread_id, (map.get(p.thread_id) ?? 0) + 1);
      return map;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nu ești autentificat.");
      const branch = await supabase.rpc("portal_branch");
      if (branch.error) throw branch.error;
      if (scope === "branch" && !branch.data) throw new Error("Contul nu are o filială asociată.");
      const { error } = await supabase.from("forum_threads").insert({ title: title.trim(), body: body.trim(), category, branch_id: scope === "branch" ? branch.data : null, author_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setBody(""); setError("");
      qc.invalidateQueries({ queryKey: ["forum-threads"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Eroare la creare."),
  });

  if (params.threadId) return <Outlet />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-display text-2xl font-bold"><MessageSquare className="text-primary" /> Forum</h2><select aria-label="Filtrează categoria" className="field w-auto" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Toate categoriile</option>{Object.entries(forumCategories).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></div>

      <form
        className="mt-6 grid gap-3 border-y border-border py-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !body.trim()) { setError("Titlul și mesajul sunt obligatorii."); return; }
          create.mutate();
        }}
      >
        <h3 className="font-semibold">Deschide un subiect nou</h3>
        <input className="rounded-lg border border-border bg-transparent px-3 py-2" aria-label="Titlu" maxLength={200} placeholder="Titlu" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={3} className="rounded-lg border border-border bg-transparent px-3 py-2" aria-label="Mesaj" maxLength={10000} placeholder="Mesaj" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex flex-wrap gap-3"><select aria-label="Categoria subiectului" className="field w-auto" value={category} onChange={e => setCategory(e.target.value)}>{Object.entries(forumCategories).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select><select aria-label="Audiență" className="field w-auto" value={scope} onChange={e => setScope(e.target.value)}><option value="national">Național</option><option value="branch">Filiala mea</option></select></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button disabled={create.isPending} className="w-fit"><Plus size={16} />
          {create.isPending ? "Se publică…" : "Publică subiectul"}
        </Button>
      </form>

      {threads.isError && <p role="alert" className="mt-4 text-destructive">Discuțiile nu au putut fi încărcate.</p>}
      <div className="mt-6 grid gap-3">
        {(threads.data ?? []).filter(t => !filter || t.category === filter).map((t) => (
          <Link
            key={t.id}
            to="/portal/forum/$threadId"
            params={{ threadId: t.id }}
            className="glass glass-hover flex items-center justify-between gap-3 rounded-2xl p-5"
          >
            <div>
              <p className="mb-2 text-xs font-medium text-primary">{forumCategories[t.category as keyof typeof forumCategories]} · {t.branch_id ? "Filială" : "Național"}</p>
              <p className="font-semibold">
                {t.locked && <span className="mr-2 inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock size={12} /> Închis</span>}
                {t.title}
              </p>
              <p className="mt-1 text-xs text-foreground/40">{new Date(t.created_at).toLocaleString("ro-RO")}</p>
            </div>
            <span className="text-sm text-foreground/50">{counts.data?.get(t.id) ?? 0} răspunsuri</span>
          </Link>
        ))}
        {threads.data?.length === 0 && <p className="text-sm text-foreground/50">Niciun subiect încă. Fii primul care deschide o discuție.</p>}
      </div>
    </div>
  );
}
