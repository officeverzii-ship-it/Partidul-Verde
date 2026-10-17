import { pageHead } from '@/lib/seo';
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, useMyRoles, type Section } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => pageHead('Privire de ansamblu', 'Panoul intern al Partidului Verde.', '/admin'),
  component: Dashboard,
});

const cards: { table: Exclude<Section,"pages"|"submissions">; label: string; to: string }[] = [
  { table: "members", label: "Membri", to: "/admin/members" },
  { table: "volunteers", label: "Voluntari", to: "/admin/volunteers" },
  { table: "branches", label: "Filiale", to: "/admin/branches" },
  { table: "articles", label: "Articole", to: "/admin/articles" },
  { table: "events", label: "Evenimente", to: "/admin/events" },
  { table: "donations", label: "Donații", to: "/admin/donations" },
];

function Dashboard() {
  const { data: me } = useMyRoles();
  const roles = me?.roles ?? [];
  const visible = cards.filter((c) => canAccess(roles, c.table));

  const stats = useQuery({
    queryKey: ["dashboard", roles.join(",")],
    enabled: !!me,
    queryFn: async () => {
      const out: Record<string, number> = {};
      await Promise.all(
        visible.map(async (c) => {
          const { count } = await supabase.from(c.table).select("id", { count: "exact", head: true });
          out[c.table] = count ?? 0;
        }),
      );
      let total = 0;
      let monthly: { month: string; sum: number }[] = [];
      if (canAccess(roles, "donations")) {
        const { data } = await supabase.from("donations").select("amount, created_at").limit(1000);
        const map = new Map<string, number>();
        for (const d of data ?? []) {
          total += Number(d.amount);
          const k = d.created_at.slice(0, 7);
          map.set(k, (map.get(k) ?? 0) + Number(d.amount));
        }
        monthly = [...map.entries()].sort().slice(-6).map(([month, sum]) => ({ month, sum }));
      }
      return { counts: out, total, monthly };
    },
  });

  const max = Math.max(1, ...(stats.data?.monthly.map((m) => m.sum) ?? [1]));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      {roles.length > 0 && visible.length === 0 && (
        <p className="glass mt-6 rounded-2xl p-6 text-foreground/70">
          Contul tău nu are încă acces la secțiuni administrative. Un Admin Național îți poate atribui un rol.
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((c) => (
          <Link key={c.table} to={c.to} className="glass glass-hover rounded-2xl p-6">
            <p className="text-xs uppercase tracking-widest text-foreground/50">{c.label}</p>
            <p className="mt-2 font-display text-4xl font-bold text-accent">{stats.data?.counts[c.table] ?? "…"}</p>
          </Link>
        ))}
      </div>

      {canAccess(roles, "donations") && (
        <div className="glass mt-6 rounded-2xl p-6">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-semibold">Donații pe lună</h2>
            <p className="font-display text-2xl font-bold text-brand">{(stats.data?.total ?? 0).toLocaleString("ro-RO")} lei</p>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {(stats.data?.monthly ?? []).map((m) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-brand" style={{ height: `${(m.sum / max) * 100}%` }} />
                <span className="text-xs text-foreground/50">{m.month}</span>
              </div>
            ))}
            {stats.data?.monthly.length === 0 && <p className="text-sm text-foreground/50">Nicio donație încă.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
