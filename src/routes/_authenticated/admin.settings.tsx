import { CampaignSettings } from "@/components/admin/CampaignSettings";
import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";
import { siteConfig } from "@/data/site";
import { pageHead } from "@/lib/seo";

export type SiteInfo = {
  name: string; tagline: string; description: string; email: string; phone: string; address: string;
  logo_url: string; facebook: string; instagram: string; youtube: string;
};

const FIELDS: { name: keyof SiteInfo; label: string }[] = [
  { name: "name", label: "Titlul site-ului" },
  { name: "tagline", label: "Slogan" },
  { name: "description", label: "Descrierea site-ului (SEO)" },
  { name: "logo_url", label: "Adresă logo (din Biblioteca media)" },
  { name: "email", label: "Email de contact" },
  { name: "phone", label: "Telefon" },
  { name: "address", label: "Adresă sediu" },
  { name: "facebook", label: "Adresă Facebook" },
  { name: "instagram", label: "Adresă Instagram" },
  { name: "youtube", label: "Adresă YouTube" },
];

export function defaultSiteInfo(): SiteInfo {
  return {
    name: siteConfig.name, tagline: siteConfig.tagline, description: siteConfig.description,
    email: siteConfig.email, phone: siteConfig.phone, address: siteConfig.address,
    logo_url: "", facebook: "https://www.facebook.com/Partidul.Verde/", instagram: "https://www.instagram.com/partidul.verde/",
    youtube: "https://www.youtube.com/playlist?list=PL7C6peR7hRFqAFy6u97rpayb8yYNmXNzN",
  };
}

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => pageHead("Setări site", "Titlu, descriere, logo și rețele sociale.", "/admin/settings"),
  component: SettingsPage,
});

function SettingsPage() {
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
    mutationFn: async (value: SiteInfo) => {
      const { error } = await supabase.from("site_settings").upsert({ key: "site", value: value as never });
      if (error) throw error;
    },
    onSuccess: () => { setMsg("Setările au fost salvate."); qc.invalidateQueries({ queryKey: ["site-settings"] }); qc.invalidateQueries({ queryKey: ["public-content"] }); },
    onError: (e: Error) => setMsg(e.message),
  });

  if (!rolesLoading && me && !canAccess(me.roles, "settings")) {
    return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;
  }

  const current: SiteInfo = { ...defaultSiteInfo(), ...((settings.data?.['site'] as Partial<SiteInfo>) ?? {}) };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const value = { ...current };
    for (const f of FIELDS) value[f.name] = String(fd.get(f.name) ?? "").trim();
    if (!value.name) return setMsg("Titlul site-ului este obligatoriu.");
    save.mutate(value);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Setări site</h1>
      <p className="mt-3 max-w-2xl text-sm text-foreground/60">Titlul, descrierea, logo-ul și rețelele sociale afișate pe întregul site.</p>
      {settings.isLoading ? (
        <p className="mt-6 text-foreground/50">Se încarcă…</p>
      ) : (
        <form onSubmit={onSubmit} className="glass mt-5 grid max-w-3xl gap-4 rounded-2xl p-6 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <label key={f.name} className={f.name === "description" || f.name === "address" ? "block sm:col-span-2" : "block"}>
              <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">{f.label}</span>
              {f.name === "description" ? (
                <textarea name={f.name} rows={3} className="field" defaultValue={current[f.name]} maxLength={300} />
              ) : (
                <input name={f.name} className="field" defaultValue={current[f.name]} maxLength={300} />
              )}
            </label>
          ))}
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button disabled={save.isPending} className="btn-brand px-5 py-2">Salvează</Button>
            {msg && <p className="text-sm text-foreground/70">{msg}</p>}
          </div>
        </form>
      )}
      {me?.roles.includes("admin_national") && <CampaignSettings />}
    </div>
  );
}
