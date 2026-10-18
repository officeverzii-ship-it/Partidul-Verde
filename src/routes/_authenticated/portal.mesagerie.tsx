import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portal/mesagerie")({
  head: () => pageHead("Mesagerie filială", "Mesaje în timp real în interiorul filialei.", "/portal/mesagerie"),
  component: Messages,
});

type Msg = { id: string; branch_id: string; author_id: string; author_name: string; body: string; created_at: string };

function Messages() {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  const me = useQuery({
    queryKey: ["msg-me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Nu ești autentificat.");
      const { data: roles } = await supabase.from("user_roles").select("role, branch_id").eq("user_id", u.user.id);
      const isNational = (roles ?? []).some((r) => r.role === "admin_national");
      const branchId = (roles ?? []).find((r) => r.role === "admin_filiala" && r.branch_id)?.branch_id ?? null;
      return { id: u.user.id as string, email: u.user.email ?? "", isNational, branchId };
    },
  });

  const branches = useQuery({
    queryKey: ["branches-list"],
    enabled: Boolean(me.data?.isNational),
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const activeBranch = me.data?.isNational ? selectedBranch : me.data?.branchId ?? "";

  const messages = useQuery({
    queryKey: ["branch-messages", activeBranch],
    enabled: Boolean(activeBranch),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_messages")
        .select("id, branch_id, author_id, author_name, body, created_at")
        .eq("branch_id", activeBranch)
        .order("created_at")
        .limit(200);
      if (error) throw error;
      return data as Msg[];
    },
  });

  useEffect(() => {
    if (!activeBranch) return;
    const channel = supabase
      .channel(`branch-messages-${activeBranch}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "branch_messages", filter: `branch_id=eq.${activeBranch}` },
        () => qc.invalidateQueries({ queryKey: ["branch-messages", activeBranch] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBranch, qc]);

  const send = useMutation({
    mutationFn: async () => {
      if (!me.data) throw new Error("Nu ești autentificat.");
      const { error } = await supabase.from("branch_messages").insert({
        branch_id: activeBranch,
        author_id: me.data.id,
        author_name: me.data.email,
        body,
      });
      if (error) throw error;
    },
    onSuccess: () => { setBody(""); setError(""); },
    onError: (e) => setError(e instanceof Error ? e.message : "Eroare la trimitere."),
  });

  if (me.isLoading) return <p className="text-foreground/60">Se încarcă…</p>;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Mesagerie filială</h2>

      {me.data?.isNational && (
        <label className="mt-4 block text-sm text-foreground/70">
          Filială:{" "}
          <select
            className="rounded-lg border border-border bg-transparent px-2 py-1"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">Alege filiala…</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      )}

      {!activeBranch ? (
        <p className="mt-6 text-sm text-foreground/50">
          {me.data?.isNational
            ? "Alege o filială pentru a vedea mesajele."
            : "Contul tău nu este asociat unei filiale. Un administrator de filială îți poate atribui filiala."}
        </p>
      ) : (
        <>
          <div className="glass mt-4 grid max-h-[480px] gap-3 overflow-y-auto rounded-2xl p-5">
            {(messages.data ?? []).map((m) => (
              <div key={m.id} className={`max-w-[80%] rounded-xl px-4 py-2 ${m.author_id === me.data?.id ? "justify-self-end bg-brand/30" : "justify-self-start bg-white/5"}`}>
                <p className="text-xs text-foreground/40">{m.author_name} · {new Date(m.created_at).toLocaleString("ro-RO")}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{m.body}</p>
              </div>
            ))}
            {messages.data?.length === 0 && <p className="text-sm text-foreground/50">Niciun mesaj încă.</p>}
          </div>

          <form
            className="mt-4 flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!body.trim()) return;
              send.mutate();
            }}
          >
            <input
              className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2"
              placeholder="Scrie un mesaj…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <button disabled={send.isPending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold">
              Trimite
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </>
      )}
    </div>
  );
}
