import { pageHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => pageHead("Portal membri", "Portalul intern al membrilor Partidului Verde.", "/portal"),
  component: PortalHome,
});

const cards = [
  { to: "/portal/documente", title: "Documente și proceduri", text: "Statut, regulamente și proceduri interne, cu acces pe rol și filială." },
  { to: "/portal/calendar", title: "Calendar intern", text: "Ședințe, termene și evenimente interne ale partidului și ale filialei tale." },
  { to: "/portal/forum", title: "Forum", text: "Discuții interne între membri, cu moderare." },
  { to: "/portal/mesagerie", title: "Mesagerie filială", text: "Mesaje în timp real în interiorul filialei tale." },
];

function PortalHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <Link key={c.to} to={c.to} className="glass glass-hover rounded-2xl p-6">
          <h2 className="font-display text-xl font-semibold">{c.title}</h2>
          <p className="mt-2 text-sm text-foreground/60">{c.text}</p>
        </Link>
      ))}
    </div>
  );
}
