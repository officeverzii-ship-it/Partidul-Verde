import { pageHead } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CrudPage } from "@/components/admin/CrudPage";
import { ExportButton } from "@/components/admin/ExportButton";
import { donationTotals } from "@/lib/payments.functions";

function PeriodTotals() {
  const [month, setMonth] = useState<{ total: number; count: number } | null>(null);
  const [year, setYear] = useState<{ total: number; count: number } | null>(null);

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
    const end = now.toISOString();
    donationTotals({ data: { from: monthStart, to: end } }).then((r) => { if (!("error" in r)) setMonth(r); }).catch(() => {});
    donationTotals({ data: { from: yearStart, to: end } }).then((r) => { if (!("error" in r)) setYear(r); }).catch(() => {});
  }, []);

  const card = (label: string, v: { total: number; count: number } | null) => (
    <div className="glass rounded-2xl px-5 py-4">
      <p className="text-xs text-foreground/60">{label}</p>
      <p className="font-display text-2xl font-bold text-brand">{v ? `${v.total.toFixed(2)} RON` : "…"}</p>
      <p className="text-xs text-foreground/60">{v ? `${v.count} donații confirmate` : ""}</p>
    </div>
  );

  return (
    <div className="mb-4 space-y-3">
      <p className="rounded-xl border border-amber-400/40 bg-amber-100/60 px-4 py-3 text-sm text-amber-900">
        Atenție: limitele legale ale donațiilor și obligațiile de raportare către Autoritatea Electorală Permanentă
        trebuie verificate cu un jurist înainte de utilizarea operacională a acestui modul.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {card("Total luna curentă", month)}
        {card("Total anul curent", year)}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/donations")({
  head: () => pageHead('Administrare donații', 'Panoul intern al Partidului Verde.', '/admin/donations'),
  component: () => (
    <>
      <PeriodTotals />
      <CrudPage
        title="Donații"
        table="donations"
        section="donations"
        searchField="donor_name"
        toolbar={<ExportButton dataset="donations" />}
        fields={[
          { name: "donor_name", label: "Donator", required: true, inList: true },
          { name: "donor_email", label: "Email", type: "email", required: true, inList: true },
          { name: "amount", label: "Sumă (lei)", type: "number", required: true, inList: true },
          { name: "currency", label: "Monedă", inList: false },
          { name: "donation_type", label: "Tip", type: "select", inList: true, options: [
            { value: "unic", label: "Unică" }, { value: "lunar", label: "Lunară" },
          ] },
          { name: "method", label: "Metodă", type: "select", required: true, inList: true, options: [
            { value: "card", label: "Card" }, { value: "transfer", label: "Transfer bancar" }, { value: "numerar", label: "Numerar" },
          ] },
          { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
            { value: "in_asteptare", label: "În așteptare" }, { value: "confirmata", label: "Confirmată" }, { value: "esuata", label: "Eșuată" }, { value: "rambursata", label: "Rambursată" },
          ] },
        ]}
      />
    </>
  ),
});
