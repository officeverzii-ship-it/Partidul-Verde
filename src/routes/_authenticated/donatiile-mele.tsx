import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";
import { pageHead } from "@/lib/seo";
import { myDonations, type DonationRow } from "@/lib/payments.functions";

export const Route = createFileRoute("/_authenticated/donatiile-mele")({
  head: () => pageHead("Donațiile mele", "Istoricul donațiilor tale către Partidul Verde.", "/donatiile-mele"),
  component: DonatiileMele,
});

const statusLabel: Record<string, string> = {
  in_asteptare: "În așteptare",
  confirmata: "Confirmată",
  esuata: "Eșuată",
  rambursata: "Rambursată",
};

function DonatiileMele() {
  const [rows, setRows] = useState<DonationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    myDonations({ data: undefined as never }).then((res) => {
      if ("error" in res) setError(res.error);
      else setRows(res.donations);
    }).catch(() => setError("Nu am putut încărca donațiile."));
  }, []);

  const total = (rows ?? []).filter((r) => r.status === "confirmata").reduce((s, r) => s + Number(r.amount), 0);

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h1 className="font-display text-4xl font-bold">Donațiile mele</h1>
        <p className="mt-3 text-foreground/70">
          Istoricul donațiilor asociate adresei tale de email. Îți mulțumim pentru sprijin!
        </p>

        {error && <p className="mt-6 rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm">{error}</p>}
        {rows === null && !error && <p className="mt-6 text-foreground/60">Se încarcă…</p>}

        {rows && rows.length === 0 && (
          <div className="glass mt-8 rounded-3xl p-8 text-center">
            <p className="text-foreground/70">Nu ai nicio donație înregistrată încă.</p>
            <Link to="/doneaza" className="btn-brand mt-4 inline-block px-6 py-3">Donează acum</Link>
          </div>
        )}

        {rows && rows.length > 0 && (
          <>
            <div className="glass mt-8 flex items-center justify-between rounded-2xl px-6 py-4">
              <span className="text-sm text-foreground/70">Total donații confirmate</span>
              <span className="font-display text-2xl font-bold text-brand">{total.toFixed(2)} RON</span>
            </div>
            <div className="mt-4 space-y-3">
              {rows.map((r) => (
                <div key={r.id} className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-6 py-4">
                  <div>
                    <p className="font-semibold">{Number(r.amount).toFixed(2)} {r.currency}{r.donation_type === "lunar" ? " / lună" : ""}</p>
                    <p className="text-xs text-foreground/60">
                      {new Date(r.paid_at ?? r.created_at).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${r.status === "confirmata" ? "bg-brand/15 text-brand" : "bg-foreground/10 text-foreground/70"}`}>
                    {statusLabel[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </Layout>
  );
}
