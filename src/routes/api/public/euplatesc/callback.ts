import { createFileRoute } from "@tanstack/react-router";

/** Notificare server-to-server de la EuPlătesc.ro. Verifică semnătura înainte de orice modificare. */
export const Route = createFileRoute("/api/public/euplatesc/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["EUPLATESC_KEY"];
        const mid = process.env["EUPLATESC_MID"];
        if (!key || !mid) return new Response("not configured", { status: 503 });

        const form = await request.formData();
        const g = (k: string) => String(form.get(k) ?? "");
        const { euplatescHash, safeEqualHex } = await import("@/lib/euplatesc.server");

        const fields = ["amount", "curr", "invoice_id", "ep_id", "merch_id", "action", "message", "approval", "timestamp", "nonce"];
        const expected = euplatescHash(fields.map(g), key);
        if (!safeEqualHex(expected, g("fp_hash")) || g("merch_id") !== mid) {
          return new Response("invalid signature", { status: 401 });
        }

        const invoiceId = g("invoice_id");
        if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) return new Response("bad invoice", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: donation } = await supabaseAdmin.from("donations").select("amount").eq("id", invoiceId).single();
        if (!donation || Number(donation.amount).toFixed(2) !== Number(g("amount")).toFixed(2)) {
          return new Response("amount mismatch", { status: 400 });
        }

        const approved = g("action") === "0";
        await supabaseAdmin
          .from("donations")
          .update({
            status: approved ? "confirmata" : "esuata",
            ep_transaction_id: g("ep_id").slice(0, 100),
            processor_message: g("message").slice(0, 300),
            paid_at: approved ? new Date().toISOString() : null,
          })
          .eq("id", invoiceId);

        return new Response("OK");
      },
    },
  },
});
