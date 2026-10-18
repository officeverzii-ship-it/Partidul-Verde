import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { exportDataset, EXPORTABLE_COLUMNS } from "@/lib/export.functions";

const COLUMN_LABELS: Record<string, string> = {
  full_name: "Nume", email: "Email", phone: "Telefon", county: "Județ", city: "Localitate",
  status: "Status", branch_id: "Filială", joined_at: "Data adeziunii", dues_paid: "Cotizații plătite",
  availability: "Disponibilitate", skills: "Competențe", created_at: "Creat la", source: "Sursă",
  tags: "Tag-uri", event_id: "Eveniment", donor_name: "Donator", donor_email: "Email donator",
  amount: "Sumă", method: "Metodă", paid_at: "Plătit la",
};

export function ExportButton({ dataset, filters = {} }: { dataset: keyof typeof EXPORTABLE_COLUMNS; filters?: Record<string, string> }) {
  const run = useServerFn(exportDataset);
  const [open, setOpen] = useState(false);
  const [cols, setCols] = useState<string[]>([...EXPORTABLE_COLUMNS[dataset]]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (c: string) => setCols((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const doExport = async (format: "csv" | "xlsx") => {
    setBusy(true);
    setErr(null);
    try {
      const res = await run({ data: { dataset, columns: cols, filters, format } });
      const blob = new Blob([res.content], { type: res.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Exportul a eșuat.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <Button onClick={() => setOpen(!open)} className="glass rounded-lg px-3 text-sm">Exportă</Button>
      {open && (
        <div className="glass absolute right-0 z-20 mt-2 w-72 rounded-xl p-4 shadow-xl">
          <p className="mb-2 text-xs uppercase tracking-wider text-foreground/50">Coloane exportate</p>
          <div className="grid max-h-48 gap-1 overflow-y-auto text-sm">
            {EXPORTABLE_COLUMNS[dataset].map((c) => (
              <label key={c} className="flex items-center gap-2">
                <input type="checkbox" checked={cols.includes(c)} onChange={() => toggle(c)} />
                {COLUMN_LABELS[c] ?? c}
              </label>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button disabled={busy || cols.length === 0} onClick={() => doExport("csv")} className="btn-brand px-3 py-1.5 text-xs">CSV</Button>
            <Button disabled={busy || cols.length === 0} onClick={() => doExport("xlsx")} className="btn-brand px-3 py-1.5 text-xs">XLSX</Button>
            <Button onClick={() => setOpen(false)} className="glass rounded-lg px-3 py-1.5 text-xs">Închide</Button>
          </div>
          {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        </div>
      )}
    </div>
  );
}
