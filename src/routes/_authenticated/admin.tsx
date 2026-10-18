import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, roleLabels, useMyRoles, type Section } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "Panou de administrare — Partidul Verde" },
      { property: "og:title", content: "Administrare — Partidul Verde" },
      { property: "og:description", content: "Panoul intern al Partidului Verde." },
      { name: "description", content: "Panou intern: conținut, membri, voluntari, filiale, donații." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const links: { to: string; label: string; section?: Section }[] = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/articles", label: "Articole", section: "articles" },
  { to: "/admin/events", label: "Evenimente", section: "events" },
  { to: "/admin/members", label: "Membri", section: "members" },
  { to: "/admin/volunteers", label: "Voluntari", section: "volunteers" },
  { to: "/admin/branches", label: "Filiale", section: "branches" },
  { to: "/admin/donations", label: "Donații", section: "donations" },
  { to: "/admin/pages", label: "Pagini", section: "pages" },
  { to: "/admin/submissions", label: "Mesaje și newsletter", section: "submissions" },
  { to: "/admin/contacts", label: "CRM Contacte", section: "contacts" },
  { to: "/admin/tasks", label: "Sarcini", section: "tasks" },
  { to: "/admin/dues", label: "Cotizații", section: "dues" },
  { to: "/admin/registrations", label: "Înscrieri evenimente", section: "registrations" },
  { to: "/admin/email-templates", label: "Șabloane email", section: "email" },
  { to: "/admin/segments", label: "Segmente", section: "email" },
  { to: "/admin/campaigns", label: "Campanii", section: "email" },
  { to: "/admin/email-log", label: "Jurnal emailuri", section: "email" },
  { to: "/admin/email-settings", label: "Setări email", section: "email" },
  { to: "/admin/media", label: "Bibliotecă media", section: "media" },
  { to: "/admin/menus", label: "Meniu și footer", section: "settings" },
  { to: "/admin/settings", label: "Setări site", section: "settings" },
  { to: "/portal", label: "Portal membri" },
];

function AdminLayout() {
  const { data } = useMyRoles();
  const roles = data?.roles ?? [];
  const qc = useQueryClient();
  const navigate = useNavigate();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen font-body">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="glass h-fit rounded-2xl p-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-brand font-display font-bold">P</div>
            <span className="font-display font-bold">Admin</span>
          </Link>
          <p className="mt-4 truncate text-xs text-foreground/50">{data?.email}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {roles.map((r) => (
              <span key={r} className="rounded-full bg-brand/20 px-2 py-0.5 text-[11px] text-accent">{roleLabels[r]}</span>
            ))}
          </div>
          <nav className="mt-6 grid gap-1 text-sm">
            {links
              .filter((l) => !l.section || canAccess(roles, l.section))
              .map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  activeOptions={{ exact: l.to === "/admin" }}
                  className="rounded-lg px-3 py-2 text-foreground/70 hover:bg-white/5 hover:text-foreground"
                  activeProps={{ className: "bg-white/10 text-foreground" }}
                >
                  {l.label}
                </Link>
              ))}
          </nav>
          <button onClick={signOut} className="mt-6 w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground/70 hover:text-foreground">
            Deconectare
          </button>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
