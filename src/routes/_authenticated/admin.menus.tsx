import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";
import { mainNav, footerNav } from "@/data/site";
import { pageHead } from "@/lib/seo";

type NavLink = { label: string; to: string };
type FooterCol = { title: string; links: NavLink[] };

export const Route = createFileRoute("/_authenticated/admin/menus")({
  head: () => pageHead("Meniu și footer", "Editorul navigării site-ului.", "/admin/menus"),
  component: MenusPage,
});

function MenusPage() {
  const qc = useQueryClient();
  const { data: me, isLoading: rolesLoading } = useMyRoles();
  const [msg, setMsg] = useState<string | null>(null);

  const settings = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key,value");
      if (error) throw error;
      const map: Record<string, unknown> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
  });

  const save = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase.from("site_settings").upsert({ key, value: value as never });
      if (error) throw error;
    },
    onSuccess: () => { setMsg("Modificările au fost salvate."); qc.invalidateQueries({ queryKey: ["site-settings"] }); qc.invalidateQueries({ queryKey: ["public-content"] }); },
    onError: (e: Error) => setMsg(e.message),
  });

  if (!rolesLoading && me && !canAccess(me.roles, "settings")) {
    return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;
  }

  const menu: NavLink[] = (settings.data?.['menu'] as NavLink[]) ?? [...mainNav];
  const footer: FooterCol[] = (settings.data?.['footer'] as FooterCol[]) ?? footerNav.map((c) => ({ title: c.title, links: [...c.links] }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Meniu și footer</h1>
      <p className="mt-3 max-w-2xl text-sm text-foreground/60">
        Editează linkurile din meniul principal și din subsolul site-ului. Câmpul „Adresă” este calea paginii, de exemplu <code>/despre</code> sau <code>/articole</code>.
      </p>
      {msg && <p className="mt-3 text-sm text-foreground/70">{msg}</p>}
      {settings.isLoading ? (
        <p className="mt-6 text-foreground/50">Se încarcă…</p>
      ) : (
        <>
          <LinkListEditor title="Meniu principal" links={menu} onSave={(links) => save.mutate({ key: "menu", value: links })} saving={save.isPending} />
          <div className="mt-10">
            <h2 className="text-xl font-bold">Footer</h2>
            {footer.map((col, i) => (
              <FooterColEditor key={i} col={col} saving={save.isPending}
                onSave={(next) => save.mutate({ key: "footer", value: footer.map((c, j) => (j === i ? next : c)) })}
                onRemove={() => confirm("Ștergi coloana din footer?") && save.mutate({ key: "footer", value: footer.filter((_, j) => j !== i) })} />
            ))}
            <Button onClick={() => save.mutate({ key: "footer", value: [...footer, { title: "Coloană nouă", links: [] }] })} className="glass mt-4 rounded-lg px-4 py-2 text-sm">+ Adaugă coloană</Button>
          </div>
        </>
      )}
    </div>
  );
}

function LinkListEditor({ title, links, onSave, saving }: { title: string; links: NavLink[]; onSave: (links: NavLink[]) => void; saving: boolean }) {
  const [rows, setRows] = useState<NavLink[]>(links);
  const update = (i: number, patch: Partial<NavLink>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="glass mt-6 max-w-2xl rounded-2xl p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {rows.map((r, i) => (
        <div key={i} className="mt-3 flex flex-wrap items-center gap-2">
          <input aria-label="Etichetă" className="field max-w-40" value={r.label} maxLength={60} onChange={(e) => update(i, { label: e.currentTarget.value })} />
          <input aria-label="Adresă" className="field max-w-56" value={r.to} maxLength={200} onChange={(e) => update(i, { to: e.currentTarget.value })} />
          <Button onClick={() => setRows(rows.filter((_, j) => j !== i))} className="text-destructive hover:underline">Șterge</Button>
        </div>
      ))}
      <div className="mt-4 flex gap-3">
        <Button onClick={() => setRows([...rows, { label: "", to: "/" }])} className="glass rounded-lg px-4 py-2 text-sm">+ Adaugă link</Button>
        <Button disabled={saving} onClick={() => { const clean = rows.filter((r) => r.label.trim() && r.to.trim()); setRows(clean); onSave(clean); }} className="btn-brand px-5 py-2 text-sm">Salvează</Button>
      </div>
    </div>
  );
}

function FooterColEditor({ col, onSave, onRemove, saving }: { col: FooterCol; onSave: (col: FooterCol) => void; onRemove: () => void; saving: boolean }) {
  const [title, setTitle] = useState(col.title);
  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <input aria-label="Titlu coloană" className="field max-w-56" value={title} maxLength={60} onChange={(e) => setTitle(e.currentTarget.value)} />
        <Button disabled={saving} onClick={() => onSave({ ...col, title: title.trim() || col.title })} className="text-accent hover:underline">Salvează titlul</Button>
        <Button onClick={onRemove} className="text-destructive hover:underline">Șterge coloana</Button>
      </div>
      <LinkListEditor title="" links={col.links} saving={saving} onSave={(links) => onSave({ ...col, links })} />
    </div>
  );
}
