import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { CrudPage, useBranchOptions } from "@/components/admin/CrudPage";
import { ExportButton } from "@/components/admin/ExportButton";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/seo";
import { importContacts } from "@/lib/import.functions";

export const Route = createFileRoute("/_authenticated/admin/contacts")({
  head: () => pageHead("CRM Contacte", "Panoul intern al Partidului Verde.", "/admin/contacts"),
  component: ContactsAdmin,
});

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (l: string) => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of l) {
      if (ch === '"') inQ = !inQ;
      else if ((ch === ";" || ch === ",") && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const header = split(lines[0] ?? "").map((h) => h.toLowerCase());
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [header[i], v])));
}

const HEADER_MAP: Record<string, string> = {
  nume: "full_name", "nume complet": "full_name", full_name: "full_name", name: "full_name",
  email: "email", "e-mail": "email", telefon: "phone", phone: "phone", tel: "phone",
  judet: "county", "județ": "county", county: "county", localitate: "city", oras: "city", "oraș": "city", city: "city",
  sursa: "source", "sursă": "source", source: "source", tags: "tags", "tag-uri": "tags",
};

function ImportDialog({ onDone }: { onDone: () => void }) {
  const run = useServerFn(importContacts);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<{ inserted: number; updated: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);

  const onFile = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return;
    const raw = parseCsv(await f.text());
    const rows = raw.map((r) => {
      const mapped: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        const key = HEADER_MAP[k];
        if (!key) continue;
        mapped[key] = key === "tags" ? v.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : v;
      }
      return mapped;
    });
    setPreview(rows);
    setReport(null);
  };

  const doImport = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      setReport(await run({ data: { rows: preview } }));
      onDone();
    } catch (e) {
      setReport({ inserted: 0, updated: 0, skipped: 0, errors: [{ row: 0, message: e instanceof Error ? e.message : "Import eșuat" }] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass mt-4 rounded-2xl p-6">
      <p className="text-sm text-foreground/70">Fișier CSV (separator ; sau ,) cu coloane: nume, email, telefon, județ, localitate, sursă, tag-uri.</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm" />
        {preview && <Button disabled={busy} onClick={doImport} className="btn-brand px-4 py-2 text-sm">Importă {preview.length} rânduri</Button>}
      </div>
      {preview && !report && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs uppercase tracking-wider text-foreground/50">Previzualizare (primele 5 rânduri)</p>
          <table className="w-full text-xs">
            <thead><tr className="text-left text-foreground/50">{["full_name", "email", "phone", "county"].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
            <tbody>{preview.slice(0, 5).map((r, i) => <tr key={i} className="border-t border-border/50">{["full_name", "email", "phone", "county"].map((h) => <td key={h} className="px-2 py-1">{String(r[h] ?? "")}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {report && (
        <div className="mt-4 text-sm">
          <p>Inserate: {report.inserted} · Actualizate: {report.updated} · Omise (duplicate): {report.skipped} · Erori: {report.errors.length}</p>
          {report.errors.slice(0, 10).map((e, i) => <p key={i} className="text-destructive">Rândul {e.row}: {e.message}</p>)}
        </div>
      )}
    </div>
  );
}

function ContactsAdmin() {
  const { data: branches = [] } = useBranchOptions();
  const qc = useQueryClient();
  const [showImport, setShowImport] = useState(false);
  return (
    <>
      <CrudPage
        title="CRM Contacte"
        table="contacts"
        section="contacts"
        searchField="full_name"
        toolbar={
          <>
            <ExportButton dataset="contacts" />
            <Button onClick={() => setShowImport(!showImport)} className="glass rounded-lg px-3 text-sm">Importă CSV</Button>
          </>
        }
        fields={[
          { name: "full_name", label: "Nume", required: true, inList: true },
          { name: "email", label: "Email", type: "email", required: true, inList: true },
          { name: "phone", label: "Telefon", inList: true },
          { name: "county", label: "Județ", inList: true },
          { name: "city", label: "Localitate" },
          { name: "source", label: "Sursă", type: "select", required: true, inList: true, options: [
            { value: "manual", label: "Manual" },
            { value: "adeziune", label: "Adeziune" }, { value: "voluntar", label: "Voluntar" },
            { value: "eveniment", label: "Eveniment" }, { value: "contact", label: "Contact" },
            { value: "newsletter", label: "Newsletter" }, { value: "import", label: "Import" },
          ] },
          { name: "tags", label: "Tag-uri", type: "tags", inList: true },
          { name: "branch_id", label: "Filială", type: "select", options: branches, inList: true },
        ]}
      />
      {showImport && <ImportDialog onDone={() => qc.invalidateQueries({ queryKey: ["contacts"] })} />}
    </>
  );
}
