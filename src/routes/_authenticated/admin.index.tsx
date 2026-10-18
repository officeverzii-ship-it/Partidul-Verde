import { pageHead } from '@/lib/seo';
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Clock, HeartHandshake, Mail, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, useMyRoles, type Section } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => pageHead('Privire de ansamblu', 'Panoul intern al Partidului Verde.', '/admin'),
  component: Dashboard,
});

const cards: { table: "members" | "volunteers" | "branches" | "articles" | "events" | "donations"; section: Section; label: string; to: string }[] = [
  { table: "members", section: "members", label: "Membri", to: "/admin/members" },
  { table: "volunteers", section: "volunteers", label: "Voluntari", to: "/admin/volunteers" },
  { table: "branches", section: "branches", label: "Filiale", to: "/admin/branches" },
  { table: "articles", section: "articles", label: "Articole", to: "/admin/articles" },
  { table: "events", section: "events", label: "Evenimente", to: "/admin/events" },
  { table: "donations", section: "donations", label: "Donații", to: "/admin/donations" },
];
void 0;

function Dashboard() {
  const { data: me } = useMyRoles();
  const roles = me?.roles ?? [];
  const visible = cards.filter((c) => canAccess(roles, c.section));

  const stats = useQuery({
    queryKey: ["dashboard", roles.join(",")],
    enabled: !!me,
    queryFn: async () => {
      const out: Record<string, number> = {};
      await Promise.all(
        visible.map(async (c) => {
          const { count, error } = await supabase.from(c.table).select("id", { count: "exact", head: true });
          if (error) throw error;
          out[c.table] = count ?? 0;
        }),
      );
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      let pending = 0;
      if (canAccess(roles, "members")) {
        const r = await supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "in_asteptare");
        if (r.error) throw r.error;
        pending = r.count ?? 0;
      }
      let campaigns = 0; let sent = 0;
      if (canAccess(roles, "email")) {
        for (let offset = 0; ; offset += 1000) {
          const r = await supabase.from("email_campaigns").select("sent_count", { count: "exact" }).gte("created_at", monthStart).order("id").range(offset, offset + 999);
          if (r.error) throw r.error;
          campaigns = r.count ?? 0; sent += (r.data ?? []).reduce((n, c) => n + c.sent_count, 0);
          if ((r.data?.length ?? 0) < 1000) break;
        }
      }
      const enrollment = [];
      if (canAccess(roles, "members")) {
        for (let i = 5; i >= 0; i--) {
          const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
          const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
          const r = await supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
          if (r.error) throw r.error;
          enrollment.push({ month: start.toLocaleDateString("ro-RO", { month: "short", timeZone: "UTC" }), count: r.count ?? 0 });
        }
      }
      let total = 0;

      if (canAccess(roles, "donations")) {
        for (let offset = 0; ; offset += 1000) {
          const r = await supabase.from("donations").select("amount").eq("status", "confirmata").eq("environment", "live").eq("currency", "RON").gte("paid_at", monthStart).order("id").range(offset, offset + 999);
          if (r.error) throw r.error;
          total += (r.data ?? []).reduce((n, d) => n + Number(d.amount), 0);
          if ((r.data?.length ?? 0) < 1000) break;
        }
      }
      return { counts: out, total, pending, campaigns, sent, enrollment };
    },
  });

  const max = Math.max(1, ...(stats.data?.enrollment.map(m => m.count) ?? [1]));

  return (
    <div>
      <p className="text-sm text-muted-foreground">Administrare · VERZII</p>
      <h1 className="mt-1 font-display text-3xl font-bold">Privire de ansamblu</h1>
      {stats.isError && <p role="alert" className="mt-4 text-destructive">Indicatorii nu au putut fi încărcați.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { section: "members" as Section, label: "Membri înregistrați", value: stats.data?.counts['members'], icon: Users, detail: "Total în aria ta de acces" },
          { section: "members" as Section, label: "Adeziuni în așteptare", value: stats.data?.pending, icon: Clock, detail: "Necesită validare" },
          { section: "donations" as Section, label: "Donații · luna curentă", value: stats.data?.total.toLocaleString("ro-RO") + " lei", icon: HeartHandshake, detail: "Confirmate · plăți reale" },
          { section: "email" as Section, label: "Campanii · luna curentă", value: stats.data?.campaigns, icon: Mail, detail: `${stats.data?.sent ?? 0} emailuri trimise` },
        ].filter(k => canAccess(roles, k.section)).map(k => <section key={k.label} className="rounded-lg border border-border bg-card p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{k.label}</p><k.icon size={20} className="shrink-0 text-primary" /></div><p className="mt-4 text-3xl font-bold">{stats.isLoading ? "…" : k.value}</p><p className="mt-2 text-xs text-muted-foreground">{k.detail}</p></section>)}
      </div>
      {canAccess(roles, "members") && <section className="mt-8 border-y border-border py-6"><h2 className="flex items-center gap-2 text-lg font-semibold"><TrendingUp size={20} className="text-primary" /> Evoluția înscrierilor</h2><div className="mt-6 grid h-40 grid-cols-6 items-end gap-3">{stats.data?.enrollment.map(m => <div key={m.month} className="flex h-full flex-col justify-end text-center"><span className="mb-2 text-sm font-semibold">{m.count}</span><div className="min-h-1 rounded-t bg-primary" style={{ height: `${Math.max(3, m.count / max * 65)}%` }} /><span className="mt-2 text-xs text-muted-foreground">{m.month}</span></div>)}</div></section>}
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


    </div>
  );
}
