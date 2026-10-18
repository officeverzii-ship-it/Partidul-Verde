import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { campaignSchema } from "@/lib/module-rules";
import { useState } from "react";

export function CampaignSettings() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const query = useQuery({ queryKey: ["donation-campaign-settings"], queryFn: async () => {
    const r = await supabase.from("site_settings").select("value").eq("key", "donation_campaign").maybeSingle();
    if (r.error) throw r.error;
    return (r.data?.value ?? null) as { enabled?: boolean; title?: string; goal?: number; since?: string; impacts?: Record<string, string> } | null;
  }});
  const save = useMutation({ mutationFn: async (value: unknown) => {
    const parsed = campaignSchema.parse(value);
    const r = await supabase.from("site_settings").upsert({ key: "donation_campaign", value: parsed });
    if (r.error) throw r.error;
  }, onSuccess: () => { setMessage("Campania a fost salvată."); qc.invalidateQueries({ queryKey: ["campaign-progress"] }); qc.invalidateQueries({ queryKey: ["donation-campaign-settings"] }); }, onError: () => setMessage("Verifică titlul, obiectivul și data campaniei.") });
  return <section className="mt-10 max-w-3xl border-t border-border pt-6">
    <h2 className="text-xl font-bold">Obiectivul campaniei de donații</h2>
    {query.isError && <p role="alert" className="mt-3 text-destructive">Campania nu a putut fi încărcată.</p>}
    {query.isSuccess && <form key={JSON.stringify(query.data)} className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={e => {
      e.preventDefault(); const fd = new FormData(e.currentTarget);
      const date = String(fd.get("since") ?? "");
      if (!date || !Number.isFinite(Date.parse(date))) { setMessage("Selectează o dată validă."); return; }
      save.mutate({ enabled: fd.get("enabled") === "on", title: fd.get("title"), goal: Number(fd.get("goal")), since: new Date(date).toISOString(), impacts: Object.fromEntries([50,100,250,500].map(n => [String(n), String(fd.get(`impact-${n}`) ?? "").trim()])) });
    }}>
      <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="enabled" defaultChecked={query.data?.enabled ?? false} /> Afișează progresul public</label>
      <label className="text-sm">Titlul campaniei<input name="title" className="field mt-1" required maxLength={100} defaultValue={query.data?.title ?? ""} /></label>
      <label className="text-sm">Obiectiv (RON)<input name="goal" type="number" className="field mt-1" required min="1" max="100000000" defaultValue={query.data?.goal} /></label>
      <label className="text-sm sm:col-span-2">Donații confirmate începând cu<input name="since" type="date" className="field mt-1" required defaultValue={query.data?.since?.slice(0,10)} /></label>
      {[50,100,250,500].map(n => <label key={n} className="text-sm">Impact pentru {n} RON<input name={`impact-${n}`} className="field mt-1" maxLength={160} defaultValue={query.data?.impacts?.[String(n)] ?? ""} /></label>)}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button disabled={save.isPending}>Salvează campania</Button>{message && <p role="status" className="text-sm">{message}</p>}</div>
    </form>}
  </section>;
}