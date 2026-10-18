import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/email-log")({
  head: () => ({ meta: [{ title: "Jurnal emailuri — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

type Msg = { id: string; email: string; subject: string | null; template_name: string | null; status: string; error: string | null; created_at: string };

function Page() {
  const { data: me, isLoading } = useMyRoles();
  const [emailFilter, setEmailFilter] = useState("");

  const list = useQuery({
    queryKey: ["email-log", emailFilter],
    queryFn: async () => {
      let q = supabase.from("email_messages").select("id, email, subject, template_name, status, error, created_at").order("created_at", { ascending: false }).limit(200);
      if (emailFilter.trim()) q = q.ilike("email", `%${emailFilter.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Msg[];
    },
  });

  if (!isLoading && me && !canAccess(me.roles, "email")) return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Jurnal emailuri</h1>
      <input className="field mt-5 max-w-xs" placeholder="Filtrează după email…" value={emailFilter} maxLength={120} onChange={(e) => setEmailFilter(e.currentTarget.value)} />
      <div className="glass mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-foreground/50">
              <th className="px-4 py-3">Destinatar</th><th className="px-4 py-3">Subiect</th><th className="px-4 py-3">Șablon</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.map((m) => (
              <tr key={m.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.subject ?? "—"}</td>
                <td className="px-4 py-3">{m.template_name ?? "—"}</td>
                <td className="px-4 py-3">{m.status}{m.error ? ` (${m.error.slice(0, 80)})` : ""}</td>
                <td className="px-4 py-3">{new Date(m.created_at).toLocaleString("ro-RO")}</td>
              </tr>
            ))}
            {list.data?.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-foreground/50">Niciun email înregistrat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
