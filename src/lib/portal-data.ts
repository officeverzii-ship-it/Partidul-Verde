import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MemberCardData = { id: string; full_name: string; status: string; joined_at: string; branch: string | null; dues: { year: number; status: string; amount: number; paid_at: string | null }[] };
export const portalHomeOptions = queryOptions({
  queryKey: ["portal-home"],
  queryFn: async () => {
    const [card, docs, events, threads] = await Promise.all([
      supabase.rpc("my_member_card"),
      supabase.from("portal_documents").select("id,title,description,kind,created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("internal_events").select("id,title,starts_at,location").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4),
      supabase.from("forum_threads").select("id,title,category,branch_id,locked,created_at").eq("locked", false).order("created_at", { ascending: false }).limit(5),
    ]);
    for (const r of [card, docs, events, threads]) if (r.error) throw r.error;
    return { card: card.data as MemberCardData | null, docs: docs.data ?? [], events: events.data ?? [], threads: threads.data ?? [] };
  },
});