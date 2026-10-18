import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { confirmNewsletterToken } from "@/lib/email.functions";

export const Route = createFileRoute("/confirmare-newsletter")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s["token"] === "string" ? (s["token"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "Confirmare abonare newsletter — Partidul Verde" },
      { name: "description", content: "Confirmarea abonării la newsletterul Partidului Verde." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Confirmare newsletter — Partidul Verde" },
      { property: "og:description", content: "Confirmarea abonării la newsletter." },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { token } = useSearch({ from: "/confirmare-newsletter" });
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");

  useEffect(() => {
    if (!token) { setState("err"); return; }
    confirmNewsletterToken({ data: { token } })
      .then(() => setState("ok"))
      .catch(() => setState("err"));
  }, [token]);

  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Abonare newsletter</h1>
      {state === "loading" && <p className="mt-4 text-foreground/60">Se confirmă…</p>}
      {state === "ok" && <p className="mt-4 text-foreground/70">Abonarea ta a fost confirmată. Îți mulțumim!</p>}
      {state === "err" && <p className="mt-4 text-foreground/70">Linkul de confirmare este invalid sau a expirat.</p>}
    </section>
  );
}
