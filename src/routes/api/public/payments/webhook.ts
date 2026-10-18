import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { escapeHtml } from '@/lib/output-safety';

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function markDonationPaid(session: any, env: StripeEnv) {
  const supabaseAdmin = await getAdmin();
  const donationId = session.metadata?.donation_id;
  if (!donationId) return;
  const { data: row } = await supabaseAdmin
    .from("donations")
    .update({
      status: "confirmata",
      paid_at: new Date().toISOString(),
      stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
      environment: env,
    })
    .eq("id", donationId)
    .neq("status", "confirmata")
    .select("id, donor_name, donor_email, amount, donation_type")
    .maybeSingle();

  // Chitanța se trimite o singură dată, la tranziția în „confirmata".
  if (row) {
    try {
      const { sendTransactional } = await import("@/lib/email.functions");
      const suma = `${Number(row.amount).toFixed(2)} RON`;
      await sendTransactional(supabaseAdmin, {
        to: row.donor_email,
        subject: "Confirmare donație — Partidul Verde",
        html: `<p>Bună, ${escapeHtml(row.donor_name)},</p><p>Îți mulțumim! Am primit donația ta de <strong>${suma}</strong>${row.donation_type === "lunar" ? " (abonament lunar)" : ""}.</p><p>Conform Legii 334/2006, donația va fi raportată către Autoritatea Electorală Permanentă.</p><p>Cu recunoștință,<br/>Partidul Verde</p>`,
        templateName: "confirmare-donatie",
      });
    } catch (e) {
      console.error("receipt email failed", e);
    }
  }
}

async function handleRenewalInvoice(invoice: any, env: StripeEnv) {
  // Reînnoirea unui abonament lunar: înregistrăm o donație nouă pentru fiecare factură plătită.
  const subscription = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  if (!subscription || invoice.billing_reason !== "subscription_cycle") return;
  const supabaseAdmin = await getAdmin();
  const { data: original } = await supabaseAdmin
    .from("donations")
    .select("donor_name, donor_email, cnp, street, city, county, phone")
    .eq("stripe_subscription_id", subscription)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!original) return;
  const line = invoice.lines?.data?.[0];
  const amount = (line?.amount ?? invoice.amount_paid ?? 0) / 100;
  if (!amount) return;
  const invoiceKey = `inv_${invoice.id}`;
  const { data: existing } = await supabaseAdmin.from("donations").select("id").eq("stripe_session_id", invoiceKey).maybeSingle();
  if (existing) return;
  await supabaseAdmin.from("donations").insert({
    ...original,
    amount,
    method: "card",
    currency: (invoice.currency ?? "ron").toUpperCase(),
    donation_type: "lunar",
    status: "confirmata",
    paid_at: new Date().toISOString(),
    stripe_session_id: invoiceKey,
    stripe_subscription_id: subscription,
    stripe_customer_id: typeof invoice.customer === "string" ? invoice.customer : null,
    environment: env,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") {
        await markDonationPaid(session, env);
      }
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await markDonationPaid(event.data.object, env);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object;
      const donationId = session.metadata?.donation_id;
      if (donationId) {
        const supabaseAdmin = await getAdmin();
        await supabaseAdmin.from("donations").update({ status: "esuata" }).eq("id", donationId).eq("status", "in_asteptare");
      }
      break;
    }
    case "invoice.paid":
      await handleRenewalInvoice(event.data.object, env);
      break;
    case "customer.subscription.deleted":
    case "customer.subscription.updated":
      // Starea abonamentului nu schimbă donațiile deja confirmate.
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
