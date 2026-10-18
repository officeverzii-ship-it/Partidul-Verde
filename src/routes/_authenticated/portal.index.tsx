import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, FileText, MessageSquare, BadgeCheck, Leaf, Megaphone, ArrowUpRight } from "lucide-react";
import { portalHomeOptions } from "@/lib/portal-data";
import { duesStatus, forumCategories } from "@/lib/module-rules";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => pageHead("Acasă · Portal membri", "Anunțuri, legitimație și activitatea internă a Partidului Verde.", "/portal"),
  loader: ({ context }) => context.queryClient.ensureQueryData(portalHomeOptions),
  errorComponent: () => <p role="alert">Activitatea internă nu a putut fi încărcată. Reîncearcă.</p>,
  notFoundComponent: () => <p>Pagina nu este disponibilă.</p>,
  component: PortalHome,
});

function PortalHome() {
  const { data } = useSuspenseQuery(portalHomeOptions);
  const member = data.card;
  const blocks = [
    { title: "Anunțuri oficiale", icon: Megaphone, rows: data.docs.filter(d => d.kind === "anunt"), to: "/portal/documente" as const },
    { title: "Ultimele proceduri", icon: FileText, rows: data.docs.filter(d => d.kind !== "anunt"), to: "/portal/documente" as const },
  ];
  return <div className="space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-sm text-muted-foreground">Comunitatea VERZII</p><h2 className="mt-1 text-2xl font-bold">{member ? `Bun venit, ${member.full_name}` : "Activitatea partidului"}</h2></div>
      <Link to="/portal/calendar" className="flex items-center gap-2 text-sm text-primary"><CalendarDays size={16} /> Calendar intern <ArrowUpRight size={16} /></Link>
    </div>
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-7">
        {blocks.map(block => <section key={block.title} className="border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold"><block.icon size={18} className="text-primary" />{block.title}</h3><Link to={block.to} className="text-xs text-primary">Vezi toate →</Link></div>
          {block.rows.slice(0, 3).map(d => <Link key={d.id} to="/portal/documente" className="block border-b border-border/60 py-3"><p className="font-medium">{d.title}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.description}</p><span className="mt-1 block text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString("ro-RO")}</span></Link>)}
          {!block.rows.length && <p className="py-3 text-sm text-muted-foreground">Nicio {block.title === "Anunțuri oficiale" ? "comunicare oficială" : "procedură"} disponibilă.</p>}
        </section>)}
        <section className="border-t border-border pt-5"><h3 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquare size={18} className="text-primary" /> Discuții active</h3>
          {data.threads.map(t => <Link key={t.id} to="/portal/forum/$threadId" params={{ threadId: t.id }} className="flex items-center justify-between gap-3 border-b border-border/60 py-3"><div><span className="text-xs text-primary">{forumCategories[t.category as keyof typeof forumCategories]} · {t.branch_id ? "Filială" : "Național"}</span><p className="font-medium">{t.title}</p></div><ArrowUpRight size={18} className="shrink-0 text-muted-foreground" /></Link>)}
          {!data.threads.length && <p className="text-sm text-muted-foreground">Nu există discuții active.</p>}
        </section>
      </div>
      <aside className="space-y-6">
        {member ? <section aria-label="Legitimație de membru" className="relative overflow-hidden rounded-lg bg-primary p-6 text-primary-foreground">
          <div className="flex items-center justify-between"><span className="text-xl font-black">VERZII</span><Leaf size={32} /></div>
          <p className="mt-6 text-xs uppercase tracking-widest opacity-80">Legitimație digitală de membru</p>
          <p className="mt-2 text-xl font-bold">{member.full_name}</p>
          <p className="mt-1 text-sm opacity-90">{member.branch ?? "Filială neatribuită"}</p>
          <div className="mt-5 border-t border-primary-foreground/25 pt-4 text-sm"><p className="flex items-center gap-2"><BadgeCheck size={16} /> Adeziune aprobată</p><p className="mt-2">Membru din {new Date(member.joined_at).toLocaleDateString("ro-RO")}</p><p className="mt-2">Cotizație: <strong>{duesStatus(member.dues)}</strong></p></div>
          <p className="mt-4 break-all text-[10px] opacity-70">ID {member.id}</p>
        </section> : <section className="rounded-lg border border-border bg-card p-5"><BadgeCheck className="text-primary" /><h3 className="mt-3 font-semibold">Cont de staff</h3><p className="mt-2 text-sm text-muted-foreground">Nu există o adeziune aprobată asociată acestui cont.</p></section>}
        <section><h3 className="mb-4 flex items-center gap-2 font-semibold"><CalendarDays size={18} className="text-primary" /> Următoarele evenimente</h3>
          {data.events.map(e => <Link key={e.id} to="/portal/calendar" className="mb-3 flex gap-3 rounded-lg border border-border bg-card p-4"><div className="flex w-12 shrink-0 flex-col items-center text-primary"><strong className="text-2xl">{new Date(e.starts_at).getDate()}</strong><span className="text-xs uppercase">{new Date(e.starts_at).toLocaleDateString("ro-RO", { month: "short" })}</span></div><div className="min-w-0"><p className="font-medium">{e.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} · {e.location ?? "Locație de confirmat"}</p></div></Link>)}
          {!data.events.length && <p className="text-sm text-muted-foreground">Niciun eveniment programat.</p>}
        </section>
      </aside>
    </div>
  </div>;
}
