import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { isAdultCnp, isValidCnp } from "./cnp";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "./stripe.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const donorSchema = z.object({
  amount: z.number().min(10).max(100000),
  donationType: z.enum(["unic", "lunar"]),
  fullName: z.string().trim().min(3).max(100),
  cnp: z.string().trim().refine(isValidCnp, "CNP invalid").refine(isAdultCnp, "Donatorul trebuie să fie major"),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  county: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^[0-9+().\s-]{9,20}$/),
  citizenship: z.boolean().refine((v) => v === true, "Declarația de cetățenie este obligatorie"),
  terms: z.boolean().refine((v) => v === true, "Acceptarea termenilor este obligatorie"),
  environment: z.enum(["sandbox", "live"]),
});

type DonorInput = z.infer<typeof donorSchema>;

// Câmpurile formularului de donație sunt configurabile din Setări (cheia
// site_settings "donation_fields"): { cnp, address, phone } — implicit toate obligatorii.
async function requiredFields(client: { from: (t: string) => any }): Promise<{ cnp: boolean; address: boolean; phone: boolean }> {
  const { data } = await client.from("site_settings").select("value").eq("key", "donation_fields").maybeSingle();
  const v = (data?.value ?? {}) as Record<string, unknown>;
  return {
    cnp: v["cnp"] !== false,
    address: v["address"] !== false,
    phone: v["phone"] !== false,
  };
}

export const createDonationCheckout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => donorSchema.parse(d))
  .handler(async ({ data }): Promise<{ clientSecret: string } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { PLAFON_ANUAL_CNP_RON, MESAJ_PLAFON } = await import("./donation-config");

    const req = requiredFields(supabaseAdmin);
    if ((await req).cnp && !data.cnp) return { error: "CNP-ul este obligatoriu." };

    // Plafon anual per CNP (Legea 334/2006): total donații confirmate în anul curent.
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)).toISOString();
    const { data: prior, error: priorErr } = await supabaseAdmin
      .from("donations")
      .select("amount")
      .eq("cnp", data.cnp)
      .eq("status", "confirmata")
      .gte("paid_at", yearStart);
    if (priorErr) {
      console.error("cap check failed", priorErr);
      return { error: "Nu am putut verifica plafonul legal. Încearcă din nou." };
    }
    const total = (prior ?? []).reduce((s, r) => s + Number(r.amount), 0);
    if (total + data.amount > PLAFON_ANUAL_CNP_RON) {
      return { error: MESAJ_PLAFON };
    }

    const { data: row, error } = await supabaseAdmin
      .from("donations")
      .insert({
        donor_name: data.fullName,
        donor_email: data.email,
        amount: data.amount,
        method: "card",
        currency: "RON",
        donation_type: data.donationType,
        environment: data.environment,
        cnp: data.cnp,
        street: data.street,
        city: data.city,
        county: data.county,
        phone: data.phone,
        citizenship_confirmed: true,
        terms_accepted: true,
      })
      .select("id")
      .single();
    if (error || !row) {
      console.error("donation insert failed", error);
      return { error: "Nu am putut înregistra donația. Încearcă din nou." };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const origin = new URL(getRequest().url).origin;
      const amountInBani = Math.round(data.amount * 100);
      const recurring = data.donationType === "lunar";
      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: "ron",
            product_data: { name: recurring ? "Donație lunară Partidul Verde" : "Donație Partidul Verde" },
            unit_amount: amountInBani,
            ...(recurring && { recurring: { interval: "month" as const } }),
          },
          quantity: 1,
        }],
        mode: recurring ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: `${origin}/doneaza?status=succes&session_id={CHECKOUT_SESSION_ID}`,
        customer_email: data.email,
        metadata: { donation_id: row.id, donation_type: data.donationType },
        ...(recurring
          ? { subscription_data: { metadata: { donation_id: row.id, donation_type: data.donationType } } }
          : { payment_intent_data: { description: "Donație Partidul Verde" } }),
      });
      await supabaseAdmin.from("donations").update({ stripe_session_id: session.id }).eq("id", row.id);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export type DonationRow = {
  id: string;
  amount: number;
  currency: string;
  donation_type: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

// „Donațiile mele": donațiile asociate emailului contului autentificat.
export const myDonations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ donations: DonationRow[] } | { error: string }> => {
    const { data: { user } } = await context.supabase.auth.getUser();
    if (!user?.email) return { donations: [] };
    const { data, error } = await context.supabase
      .from("donations")
      .select("id, amount, currency, donation_type, status, created_at, paid_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { error: "Nu am putut încărca donațiile." };
    return { donations: (data ?? []) as DonationRow[] };
  });

// Total donații confirmate pe o perioadă (admin, pentru panoul de donații).
export const donationTotals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from: string; to: string }) => d)
  .handler(async ({ data, context }): Promise<{ total: number; count: number } | { error: string }> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin_national" });
    const { data: isBranch } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin_filiala" });
    if (!isAdmin && !isBranch) return { error: "Forbidden" };
    const { data: rows, error } = await context.supabase
      .from("donations")
      .select("amount")
      .eq("status", "confirmata")
      .gte("paid_at", data.from)
      .lte("paid_at", data.to);
    if (error) return { error: "Nu am putut calcula totalul." };
    return { total: (rows ?? []).reduce((s, r) => s + Number(r.amount), 0), count: rows?.length ?? 0 };
  });
