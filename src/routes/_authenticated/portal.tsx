import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Portal membri — Partidul Verde" },
      { property: "og:title", content: "Portal membri — Partidul Verde" },
      { property: "og:description", content: "Portalul intern al membrilor Partidului Verde." },
      { name: "description", content: "Portal intern: documente, calendar, forum, mesagerie de filială." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PortalLayout,
});

const links = [
  { to: "/portal", label: "Prezentare" },
  { to: "/portal/documente", label: "Documente" },
  { to: "/portal/calendar", label: "Calendar intern" },
  { to: "/portal/forum", label: "Forum" },
  { to: "/portal/mesagerie", label: "Mesagerie filială" },
];

export function usePortalAccess() {
  return useQuery({
    queryKey: ["portal-access"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data, error } = await supabase.rpc("portal_access", { _user_id: u.user.id });
      if (error) throw error;
      return Boolean(data);
    },
  });
}

function PortalLayout() {
  const access = usePortalAccess();

  if (access.isLoading) {
    return <div className="mx-auto max-w-5xl px-6 py-16 text-foreground/60">Se verifică accesul…</div>;
  }
  if (!access.data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-3xl font-bold">Portal membri</h1>
        <p className="glass mt-6 rounded-2xl p-6 text-foreground/70">
          Portalul intern este disponibil membrilor cu adeziunea aprobată. Dacă ai depus cererea de
          adeziune, aceasta trebuie mai întâi validată de un administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Portal membri</h1>
        <nav className="flex flex-wrap gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/portal" }}
              className="rounded-lg border border-border px-3 py-1.5 text-foreground/70 hover:text-foreground"
              activeProps={{ className: "bg-brand/20 text-foreground border-brand/40" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
