import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/portal/forum/$threadId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Discuție — Forum intern" },
      { name: "description", content: "Discuție pe forumul intern al membrilor." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Thread,
});

const MODERATORS: AppRole[] = ["admin_national", "admin_filiala", "editor"];

function Thread() {
  const { threadId } = Route.useParams();
  const { data: me } = useMyRoles();
  const roles = me?.roles ?? [];
  const canModerate = roles.some((r) => MODERATORS.includes(r));
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  const thread = useQuery({
    queryKey: ["forum-thread", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_threads")
        .select("id, title, body, author_id, locked, created_at")
        .eq("id", threadId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const posts = useQuery({
    queryKey: ["forum-posts", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("id, body, author_id, hidden, created_at")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["forum-posts", threadId] });
    qc.invalidateQueries({ queryKey: ["forum-thread", threadId] });
  };

  const reply = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nu ești autentificat.");
      const { error } = await supabase.from("forum_posts").insert({ thread_id: threadId, body, author_id: u.user.id });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); setError(""); invalidate(); },
    onError: (e) => setError(e instanceof Error ? e.message : "Eroare la trimitere."),
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const { error } = await supabase.from("forum_posts").update({ hidden }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleLocked = useMutation({
    mutationFn: async (locked: boolean) => {
      const { error } = await supabase.from("forum_threads").update({ locked }).eq("id", threadId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  if (thread.isLoading) return <p className="text-foreground/60">Se încarcă…</p>;
  if (!thread.data) return <p className="text-foreground/60">Subiectul nu a fost găsit.</p>;

  const t = thread.data;
  const myId = me?.email; // email displayed; author compare via user id below

  return (
    <div>
      <Link to="/portal/forum" className="text-sm text-accent hover:underline">← Înapoi la forum</Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-2xl font-bold">{t.title}</h2>
        {canModerate && (
          <button
            onClick={() => toggleLocked.mutate(!t.locked)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground/70 hover:text-foreground"
          >
            {t.locked ? "Redeschide subiectul" : "Închide subiectul"}
          </button>
        )}
      </div>

      <div className="glass mt-4 rounded-2xl p-5">
        <p className="whitespace-pre-wrap text-foreground/80">{t.body}</p>
        <p className="mt-2 text-xs text-foreground/40">{new Date(t.created_at).toLocaleString("ro-RO")}</p>
      </div>

      <div className="mt-4 grid gap-3">
        {(posts.data ?? []).map((p) => (
          <div key={p.id} className={`glass rounded-2xl p-5 ${p.hidden ? "opacity-50" : ""}`}>
            <p className="whitespace-pre-wrap text-foreground/80">
              {p.hidden && !canModerate ? "Acest răspuns a fost ascuns de un moderator." : p.body}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs text-foreground/40">
              <span>{new Date(p.created_at).toLocaleString("ro-RO")}</span>
              {p.hidden && canModerate && <span className="text-yellow-300">ascuns</span>}
              {canModerate && (
                <button
                  onClick={() => toggleHidden.mutate({ id: p.id, hidden: !p.hidden })}
                  className="text-accent hover:underline"
                >
                  {p.hidden ? "Afișează" : "Ascunde"}
                </button>
              )}
            </div>
          </div>
        ))}
        {void myId}
      </div>

      {t.locked ? (
        <p className="mt-6 text-sm text-foreground/50">Subiectul este închis; nu se mai pot adăuga răspunsuri.</p>
      ) : (
        <form
          className="glass mt-6 grid gap-3 rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) { setError("Scrie un mesaj."); return; }
            reply.mutate();
          }}
        >
          <textarea rows={3} className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Răspunsul tău" value={body} onChange={(e) => setBody(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={reply.isPending} className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-semibold">
            {reply.isPending ? "Se trimite…" : "Trimite răspunsul"}
          </button>
        </form>
      )}
    </div>
  );
}
