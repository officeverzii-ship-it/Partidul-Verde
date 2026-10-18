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
  const [error, setError] = useState("");

  const threads = useQuery({
    queryKey: ["forum-threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_threads")
        .select("id, title, author_id, locked, created_at")
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
      const { error } = await supabase.from("forum_threads").insert({ title, body, author_id: u.user.id });
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
      <h2 className="font-display text-2xl font-bold">Forum</h2>

      <form
        className="glass mt-6 grid gap-3 rounded-2xl p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !body.trim()) { setError("Titlul și mesajul sunt obligatorii."); return; }
          create.mutate();
        }}
      >
        <h3 className="font-semibold">Deschide un subiect nou</h3>
        <input className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Titlu" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea rows={3} className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Mesaj" value={body} onChange={(e) => setBody(e.target.value)} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={create.isPending} className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-semibold">
          {create.isPending ? "Se publică…" : "Publică subiectul"}
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        {(threads.data ?? []).map((t) => (
          <Link
            key={t.id}
            to="/portal/forum/$threadId"
            params={{ threadId: t.id }}
            className="glass glass-hover flex items-center justify-between gap-3 rounded-2xl p-5"
          >
            <div>
              <p className="font-semibold">
                {t.locked && <span className="mr-2 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[11px] text-yellow-300">închis</span>}
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
