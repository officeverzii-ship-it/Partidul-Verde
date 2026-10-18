import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/portal/calendar")({
  head: () => pageHead("Calendar intern", "Evenimente interne ale Partidului Verde.", "/portal/calendar"),
  component: Calendar,
});

const STAFF: AppRole[] = ["admin_national", "admin_filiala", "coordonator_voluntari"];

function Calendar() {
  const { data: me } = useMyRoles();
  const isStaff = (me?.roles ?? []).some((r) => STAFF.includes(r));
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const events = useQuery({
    queryKey: ["internal-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_events")
        .select("id, title, description, starts_at, location, branches(name)")
        .gte("starts_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .order("starts_at");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("internal_events").insert({
        title,
        description: description || null,
        starts_at: new Date(startsAt).toISOString(),
        location: location || null,
        created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle(""); setStartsAt(""); setLocation(""); setDescription(""); setError("");
      qc.invalidateQueries({ queryKey: ["internal-events"] });
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Eroare la salvare."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("internal_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["internal-events"] }),
  });

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Calendar intern</h2>

      {isStaff && (
        <form
          className="glass mt-6 grid gap-3 rounded-2xl p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !startsAt) { setError("Titlul și data sunt obligatorii."); return; }
            add.mutate();
          }}
        >
          <h3 className="font-semibold">Adaugă eveniment intern</h3>
          <input className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Titlu" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="datetime-local" className="rounded-lg border border-border bg-transparent px-3 py-2" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          <input className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Locație (opțional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <textarea className="rounded-lg border border-border bg-transparent px-3 py-2" placeholder="Descriere (opțional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={add.isPending} className="w-fit rounded-lg bg-brand px-4 py-2 text-sm font-semibold">
            {add.isPending ? "Se salvează…" : "Salvează evenimentul"}
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-3">
        {(events.data ?? []).map((ev) => (
          <div key={ev.id} className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
            <div>
              <p className="font-semibold">{ev.title}</p>
              <p className="mt-1 text-sm text-foreground/60">
                {new Date(ev.starts_at).toLocaleString("ro-RO", { dateStyle: "long", timeStyle: "short" })}
                {ev.location ? ` · ${ev.location}` : ""}
                {ev.branches?.name ? ` · ${ev.branches.name}` : ""}
              </p>
              {ev.description && <p className="mt-1 text-sm text-foreground/50">{ev.description}</p>}
            </div>
            {isStaff && (
              <button onClick={() => remove.mutate(ev.id)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10">
                Șterge
              </button>
            )}
          </div>
        ))}
        {events.data?.length === 0 && <p className="text-sm text-foreground/50">Niciun eveniment intern programat.</p>}
      </div>
    </div>
  );
}
