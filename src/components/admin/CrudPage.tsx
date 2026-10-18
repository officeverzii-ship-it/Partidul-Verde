import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { mergeTags } from "@/lib/module-rules";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles, type Section } from "@/lib/roles";

type Row = Record<string, unknown> & { id: string };

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "datetime-local" | "textarea" | "select" | "tags";
  options?: { value: string; label: string }[];
  required?: boolean;
  inList?: boolean;
};

export function useBranchOptions() {
  return useQuery({
    queryKey: ["branch-options"],
    queryFn: async () => {
      const { data } = await supabase.from("branches").select("id, city").order("city");
      return (data ?? []).map((b) => ({ value: b.id, label: b.city }));
    },
  });
}

const PAGE = 10;

export function CrudPage({
  title,
  table,
  section,
  fields,
  orderBy = "created_at",
  searchField,
  canCreate = true,
  toolbar,
}: {
  title: string;
  table: "articles" | "members" | "volunteers" | "branches" | "events" | "donations" | "site_pages" | "site_submissions" | "contacts" | "tasks" | "dues" | "event_registrations" | "email_templates" | "email_segments" | "email_campaigns" | "email_messages" | "email_suppressions";
  section: Section;
  fields: FieldDef[];
  orderBy?: string;
  searchField: string;
  canCreate?: boolean;
  toolbar?: React.ReactNode;
}) {
  const qc = useQueryClient();
  const { data: me, isLoading: rolesLoading } = useMyRoles();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [asc, setAsc] = useState(false);
  const [editing, setEditing] = useState<Row | null | "new">(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkField, setBulkField] = useState("status");
  const [bulkValue, setBulkValue] = useState("");
  const [notice, setNotice] = useState("");
  const bulkFields = fields.filter(f => ["status", "branch_id", "tags"].includes(f.name) && !(table === "tasks" && f.name === "branch_id"));
  const bulkEnabled = ["members", "volunteers", "contacts", "tasks"].includes(table);
  const drawer = table === "contacts";
  const [err, setErr] = useState<string | null>(null);

  const list = useQuery({
    queryKey: [table, q, page, asc],
    queryFn: async () => {
      let query = supabase.from(table).select("*", { count: "exact" }).order(orderBy, { ascending: asc });
      if (q.trim()) query = query.ilike(searchField, `%${q.trim()}%`);
      const { data, error, count } = await query.range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: (data ?? []) as unknown as Row[], count: count ?? 0 };
    },
  });

  const save = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const res =
        editing && editing !== "new"
          ? await supabase.from(table).update(values as never).eq("id", editing.id)
          : await supabase.from(table).insert(values as never);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: [table] });
      qc.invalidateQueries({ queryKey: ["public-content"] });
    },
    onError: (e: Error) => setErr(e.message),
  });

  const bulk = useMutation({
    mutationFn: async () => {
      const field = bulkFields.find(f => f.name === bulkField) ?? bulkFields[0];
      if (!field || !bulkValue.trim()) throw new Error("Alege o valoare pentru acțiunea în lot.");
      const { data, error } = await supabase.rpc("crm_bulk_change", { _table: table, _ids: selected, _field: field.name, _value: field.name === "tags" ? mergeTags([], bulkValue).join(",") : bulkValue });
      if (error) throw error;
      return data;
    },
    onSuccess: n => { setNotice(`${n} înregistrări actualizate.`); setSelected([]); setBulkValue(""); qc.invalidateQueries({ queryKey: [table] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: Error) => setNotice(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: Error) => alert(e.message),
  });

  const listFields = useMemo(() => fields.filter((f) => f.inList), [fields]);

  if (!rolesLoading && me && !canAccess(me.roles, section)) {
    return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const values: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = String(fd.get(f.name) ?? "").trim();
      if (f.required && !raw) return setErr(`Câmpul „${f.label}” este obligatoriu.`);
      if (f.type === "email" && raw && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(raw)) return setErr("Email invalid.");
      values[f.name] = raw === "" ? (f.type === "tags" ? [] : null) : f.type === "number" ? Number(raw) : f.type === "datetime-local" ? new Date(raw).toISOString() : f.type === "tags" ? raw.split(",").map((t) => t.trim()).filter(Boolean) : raw;
    }
    save.mutate(values);
  };

  const pages = Math.max(1, Math.ceil((list.data?.count ?? 0) / PAGE));
  const current = editing && editing !== "new" ? editing : null;

  const display = (f: FieldDef, v: unknown) => {
    if (v == null) return "—";
    if (f.type === "select") return f.options?.find((o) => o.value === v)?.label ?? String(v);
    if (f.type === "datetime-local" || f.type === "date") return new Date(String(v)).toLocaleDateString("ro-RO");
    if (f.type === "tags" && Array.isArray(v)) return v.join(", ");
    return String(v);
  };

  const editForm = editing ? (
        <form key={current?.id ?? "new"} onSubmit={onSubmit} className={drawer ? "mt-5 grid gap-4" : "glass mt-5 grid gap-4 rounded-lg p-6 sm:grid-cols-2"}>
          {fields.map((f) => {
            const dv = current?.[f.name];
            const defaultValue = dv == null ? "" : f.type === "datetime-local" ? new Date(String(dv)).toISOString().slice(0, 16) : f.type === "tags" && Array.isArray(dv) ? dv.join(", ") : String(dv);
            return <label key={f.name} className={!drawer && f.type === "textarea" ? "block sm:col-span-2" : "block"}>
              <span className="mb-1.5 block text-xs text-muted-foreground">{f.label}{f.required && " *"}</span>
              {f.type === "textarea" ? <textarea name={f.name} rows={5} className="field" defaultValue={defaultValue} maxLength={200000} /> : f.type === "select" ? <select name={f.name} className="field" defaultValue={defaultValue}>{!f.required && <option value="">—</option>}{f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <input name={f.name} type={f.type === "tags" ? "text" : f.type ?? "text"} step={f.type === "number" ? "0.01" : undefined} className="field" defaultValue={defaultValue} maxLength={500} />}
            </label>;
          })}
          <div className={`flex gap-3 ${drawer ? "" : "sm:col-span-2"}`}><Button disabled={save.isPending}>Salvează</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Anulează</Button></div>
          {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        </form>
  ) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-2">
          {toolbar}
          {canCreate && (
            <Button onClick={() => { setErr(null); setEditing("new"); }} className="btn-brand px-4 py-2 text-sm">+ Adaugă</Button>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <input className="field max-w-xs" placeholder="Caută…" value={q} maxLength={80} onChange={(e) => { setQ(e.currentTarget.value); setPage(0); setSelected([]); }} />
        <Button onClick={() => (setAsc(!asc), setSelected([]))} className="glass rounded-lg px-3 text-sm">{asc ? "Cele mai vechi" : "Cele mai noi"}</Button>
      </div>

      {drawer ? <Sheet open={Boolean(editing)} onOpenChange={open => { if (!open) setEditing(null); }}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{current ? String(current['full_name']) : "Contact nou"}</SheetTitle><SheetDescription>{current ? String(current['email']) : "Fișă de contact"}</SheetDescription></SheetHeader>{editForm}</SheetContent></Sheet> : editForm}
      {bulkEnabled && selected.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-secondary p-3">
        <strong className="text-sm">{selected.length} selectate</strong>
        <select aria-label="Acțiune în lot" className="field w-auto" value={bulkFields.some(f => f.name === bulkField) ? bulkField : bulkFields[0]?.name} onChange={e => { setBulkField(e.target.value); setBulkValue(""); }}>
          {bulkFields.map(f => <option key={f.name} value={f.name}>{f.name === "tags" ? "Adaugă etichete" : f.label}</option>)}
        </select>
        {(() => { const field = bulkFields.find(f => f.name === bulkField) ?? bulkFields[0]; return field?.type === "select" ? <select aria-label="Valoare în lot" className="field w-auto max-w-full" value={bulkValue} onChange={e => setBulkValue(e.target.value)}><option value="">Selectează…</option>{field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : <input aria-label="Etichete în lot" className="field max-w-xs" placeholder="Etichete separate prin virgulă" value={bulkValue} onChange={e => setBulkValue(e.target.value)} maxLength={200} />; })()}
        <Button disabled={bulk.isPending || !bulkValue} onClick={() => confirm(`Aplici modificarea pentru ${selected.length} înregistrări?`) && bulk.mutate()}>{bulk.isPending ? "Se aplică…" : "Aplică"}</Button>
        <Button variant="ghost" onClick={() => setSelected([])}>Renunță</Button>
      </div>}
      {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
      {list.isError && <p role="alert" className="mt-3 text-sm text-destructive">Lista nu a putut fi încărcată.</p>}

      <div className="glass mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-foreground/50">
              {bulkEnabled && <th className="px-4 py-3"><input type="checkbox" aria-label="Selectează pagina" checked={Boolean(list.data?.rows.length) && (list.data?.rows.every(r => selected.includes(r.id)) ?? false)} onChange={e => setSelected(e.target.checked ? (list.data?.rows.map(r => r.id) ?? []) : [])} /></th>}
              {listFields.map((f) => <th key={f.name} className="px-4 py-3">{f.label}</th>)}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.data?.rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                {bulkEnabled && <td className="px-4 py-3"><input type="checkbox" aria-label={`Selectează ${r[searchField]}`} checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))} /></td>}
                {listFields.map((f) => <td key={f.name} className="px-4 py-3">{display(f, r[f.name])}</td>)}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => { setErr(null); setEditing(r); }} className="text-primary">Editează</Button>
                  <Button variant="ghost" onClick={() => confirm("Ștergi înregistrarea?") && remove.mutate(r.id)} className="ml-3 text-destructive">Șterge</Button>
                </td>
              </tr>
            ))}
            {list.data?.rows.length === 0 && (
              <tr><td colSpan={listFields.length + (bulkEnabled ? 2 : 1)} className="px-4 py-8 text-center text-foreground/50">Nicio înregistrare.</td></tr>
            )}
            {list.isLoading && (
              <tr><td colSpan={listFields.length + (bulkEnabled ? 2 : 1)} className="px-4 py-8 text-center text-foreground/50">Se încarcă…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end gap-3 text-sm">
        <Button disabled={page === 0} onClick={() => (setPage(page - 1), setSelected([]))} className="glass rounded-lg px-3 py-1 disabled:opacity-40">←</Button>
        <span className="text-foreground/60">{page + 1} / {pages}</span>
        <Button disabled={page + 1 >= pages} onClick={() => (setPage(page + 1), setSelected([]))} className="glass rounded-lg px-3 py-1 disabled:opacity-40">→</Button>
      </div>
    </div>
  );
}
