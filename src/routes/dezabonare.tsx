import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { unsubscribeByToken } from "@/lib/email.functions";

export const Route = createFileRoute("/dezabonare")({
  validateSearch: (s: Record<string, unknown>) => ({ token: typeof s["token"] === "string" ? (s["token"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "Dezabonare — Partidul Verde" },
      { name: "description", content: "Dezabonare de la comunicările prin email ale Partidului Verde." },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Dezabonare — Partidul Verde" },
      { property: "og:description", content: "Dezabonare de la comunicările prin email." },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const { token } = useSearch({ from: "/dezabonare" });
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");

  useEffect(() => {
    if (!token) { setState("err"); return; }
    unsubscribeByToken({ data: { token } })
      .then(() => setState("ok"))
      .catch(() => setState("err"));
  }, [token]);

  return (
    <section className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">Dezabonare</h1>
      {state === "loading" && <p className="mt-4 text-foreground/60">Se procesează…</p>}
      {state === "ok" && <p className="mt-4 text-foreground/70">Ai fost dezabonat(ă). Nu vei mai primi emailuri comerciale de la noi.</p>}
      {state === "err" && <p className="mt-4 text-foreground/70">Linkul de dezabonare este invalid sau a expirat.</p>}
    </section>
  );
}
