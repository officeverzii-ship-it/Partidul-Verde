import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { isAdultCnp, isValidCnp } from "./cnp";

const schema = z.object({
  amount: z.number().min(10).max(100000),
  fullName: z.string().trim().min(3).max(100),
  cnp: z.string().trim().refine(isValidCnp, "CNP invalid").refine(isAdultCnp, "Donatorul trebuie să fie major"),
  street: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  county: z.string().trim().min(2).max(40),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().regex(/^[0-9+().\s-]{9,20}$/),
  citizenship: z.literal(true),
  terms: z.literal(true),
});

export type DonationInput = z.infer<typeof schema>;

export const startDonation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const mid = process.env["EUPLATESC_MID"];
    const key = process.env["EUPLATESC_KEY"];
    if (!mid || !key) {
      return { ok: false as const, error: "Plata online nu este încă configurată. Revino în curând." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { euplatescHash, gmTimestamp, nonce, EUPLATESC_URL } = await import("./euplatesc.server");
    const { PLAFON_ANUAL_CNP_RON, MESAJ_PLAFON } = await import("./donation-config");

    // Plafon anual per CNP (Legea 334/2006): total donații confirmate în anul calendaristic curent.
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)).toISOString();
    const { data: prior, error: priorErr } = await supabaseAdmin
      .from("donations")
      .select("amount")
      .eq("cnp", data.cnp)
      .eq("status", "confirmata")
      .gte("paid_at", yearStart);
    if (priorErr) {
      console.error("cap check failed", priorErr);
      return { ok: false as const, error: "Nu am putut verifica plafonul legal. Încearcă din nou." };
    }
    const total = (prior ?? []).reduce((s, r) => s + Number(r.amount), 0);
    if (total + data.amount > PLAFON_ANUAL_CNP_RON) {
      return { ok: false as const, error: MESAJ_PLAFON };
    }

    const { data: row, error } = await supabaseAdmin
      .from("donations")
      .insert({
        donor_name: data.fullName,
        donor_email: data.email,
        amount: data.amount,
        method: "card",
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
      return { ok: false as const, error: "Nu am putut înregistra donația. Încearcă din nou." };
    }

    const req = getRequest();
    const origin = new URL(req.url).origin;

    const amount = data.amount.toFixed(2);
    const curr = "RON";
    const invoiceId = row.id;
    const orderDesc = "Donatie Partidul Verde";
    const timestamp = gmTimestamp();
    const n = nonce();
    const fp_hash = euplatescHash([amount, curr, invoiceId, orderDesc, mid, timestamp, n], key);

    const [fname, ...rest] = data.fullName.split(" ");
    return {
      ok: true as const,
      action: EUPLATESC_URL,
      fields: {
        amount,
        curr,
        invoice_id: invoiceId,
        order_desc: orderDesc,
        merch_id: mid,
        timestamp,
        nonce: n,
        fp_hash,
        fname: fname ?? "",
        lname: rest.join(" "),
        country: "Romania",
        city: data.city,
        state: data.county,
        add: data.street,
        email: data.email,
        phone: data.phone,
        lang: "ro",
        "ExtraData[silenturl]": `${origin}/api/public/euplatesc/callback`,
        "ExtraData[successurl]": `${origin}/doneaza?status=succes`,
        "ExtraData[failedurl]": `${origin}/doneaza?status=esuat`,
        "ExtraData[backtosite]": `${origin}/doneaza`,
      } as Record<string, string>,
    };
  });
