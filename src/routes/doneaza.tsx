import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Layout } from "@/components/site/Layout";
import { Field } from "@/components/site/Form";
import { isAdultCnp, isValidCnp } from "@/lib/cnp";
import { startDonation } from "@/lib/donations.functions";

export const Route = createFileRoute("/doneaza")({
  validateSearch: z.object({ status: z.enum(["succes", "esuat"]).optional() }),
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "Donează — Partidul Verde" },
      {
        name: "description",
        content: "Susține Partidul Verde printr-o donație securizată cu cardul, conformă Legii 334/2006, procesată de EuPlătesc.ro.",
      },
      { property: "og:title", content: "Susține viziunea noastră pentru România — Partidul Verde" },
      { property: "og:description", content: "Donație securizată cu cardul prin EuPlătesc.ro, conformă Legii 334/2006." },
    ],
  }),
  component: Doneaza,
});

const presets = [50, 100, 250, 500];
const emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const phoneRe = /^[0-9+().\s-]{9,20}$/;

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium">
      <span className="size-1.5 rounded-full bg-brand" />
      {children}
    </span>
  );
}

function CardLogo({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-border bg-foreground/90 px-3 py-1 font-display text-xs font-bold tracking-wide text-background">
      {label}
    </span>
  );
}

function Doneaza() {
  const { status } = Route.useSearch();
  const start = useServerFn(startDonation);
  const [preset, setPreset] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [v, setV] = useState<Record<string, string>>({});
  const [citizenship, setCitizenship] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const amount = custom ? Number(custom.replace(",", ".")) : preset ?? 0;
  const set = (k: string) => (e: { currentTarget: { value: string } }) =>
    setV((s) => ({ ...s, [k]: e.currentTarget.value }));
  const val = (k: string) => (v[k] ?? "").trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!Number.isFinite(amount) || amount < 10) return setError("Suma minimă este 10 RON.");
    if (amount > 100000) return setError("Pentru sume mai mari, te rugăm să ne contactezi.");
    for (const k of ["fullName", "cnp", "street", "city", "county", "email", "phone"])
      if (!val(k)) return setError("Te rugăm să completezi toate câmpurile.");
    if (!isValidCnp(val("cnp"))) return setError("CNP-ul introdus nu este valid.");
    if (!isAdultCnp(val("cnp"))) return setError("Donațiile pot fi făcute doar de persoane majore.");
    if (!emailRe.test(val("email"))) return setError("Adresa de email nu este validă.");
    if (!phoneRe.test(val("phone"))) return setError("Numărul de telefon nu este valid.");
    if (!citizenship || !terms) return setError("Te rugăm să bifezi ambele declarații obligatorii.");

    setBusy(true);
    try {
      const res = await start({
        data: {
          amount: Math.round(amount * 100) / 100,
          fullName: val("fullName"),
          cnp: val("cnp"),
          street: val("street"),
          city: val("city"),
          county: val("county"),
          email: val("email"),
          phone: val("phone"),
          citizenship: true,
          terms: true,
        },
      });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = res.action;
      for (const [name, value] of Object.entries(res.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Datele nu au putut fi validate. Verifică formularul.");
      setBusy(false);
    }
  };

  return (
    <Layout>
      <section className="mx-auto max-w-3xl px-6 pt-14 pb-6 text-center">
        <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
          Susține viziunea noastră <span className="text-brand">pentru România</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/70">
          Fiecare donație finanțează campanii pentru aer curat, energie verde și comunități implicate. Transparent și legal.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Badge>Plăți securizate EuPlătesc.ro</Badge>
          <Badge>Conform Legii 334/2006</Badge>
        </div>
      </section>

      {status && (
        <div className="mx-auto max-w-3xl px-6">
          <p className={`rounded-2xl border px-5 py-4 text-sm ${status === "succes" ? "border-brand/40 bg-brand/15" : "border-destructive/50 bg-destructive/15"}`}>
            {status === "succes"
              ? "Mulțumim! Plata a fost procesată. Vei primi confirmarea pe email."
              : "Plata nu a fost finalizată. Nu s-a debitat nicio sumă — poți încerca din nou."}
          </p>
        </div>
      )}

      <section className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={submit} className="glass space-y-8 rounded-3xl p-6 sm:p-8" noValidate>
          <div>
            <h2 className="font-display text-xl font-semibold">1. Alege suma</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => { setPreset(p); setCustom(""); }}
                  className={!custom && preset === p ? "btn-brand py-3" : "glass rounded-xl py-3 font-semibold"}
                >
                  {p} RON
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Field label="Altă sumă (RON)">
                <input
                  inputMode="decimal"
                  className="field"
                  placeholder="ex. 150"
                  value={custom}
                  maxLength={9}
                  onChange={(e) => setCustom(e.currentTarget.value.replace(/[^0-9.,]/g, ""))}
                />
              </Field>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold">2. Datele donatorului</h2>
            <p className="mt-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground/80">
              Conform Legii 334/2006, partidele au obligația de a identifica donatorii și de a raporta donațiile către
              Autoritatea Electorală Permanentă (AEP). Datele sunt folosite exclusiv în acest scop.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nume complet" full><input className="field" maxLength={100} autoComplete="name" onChange={set("fullName")} /></Field>
              <Field label="CNP">
                <input className="field" inputMode="numeric" maxLength={13} value={v["cnp"] ?? ""} onChange={(e) => setV((s) => ({ ...s, cnp: e.currentTarget.value.replace(/\D/g, "") }))} />
              </Field>
              <Field label="Telefon"><input type="tel" className="field" maxLength={20} autoComplete="tel" onChange={set("phone")} /></Field>
              <Field label="Stradă, număr, bloc, apartament" full><input className="field" maxLength={200} autoComplete="street-address" onChange={set("street")} /></Field>
              <Field label="Localitate"><input className="field" maxLength={80} autoComplete="address-level2" onChange={set("city")} /></Field>
              <Field label="Județ"><input className="field" maxLength={40} autoComplete="address-level1" onChange={set("county")} /></Field>
              <Field label="Email" full><input type="email" className="field" maxLength={255} autoComplete="email" onChange={set("email")} /></Field>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex gap-3 text-sm text-foreground/80">
              <input type="checkbox" className="mt-1 size-4 accent-[var(--brand)]" checked={citizenship} onChange={(e) => setCitizenship(e.currentTarget.checked)} />
              <span>
                Declar pe propria răspundere că sunt cetățean român, că suma donată provine din surse proprii și că
                donația respectă prevederile Legii nr. 334/2006 privind finanțarea activității partidelor politice.
              </span>
            </label>
            <label className="flex gap-3 text-sm text-foreground/80">
              <input type="checkbox" className="mt-1 size-4 accent-[var(--brand)]" checked={terms} onChange={(e) => setTerms(e.currentTarget.checked)} />
              <span>
                Accept <Link to="/termeni-si-conditii" className="text-brand underline">Termenii</Link> și <Link to="/confidentialitate" className="text-brand underline">Politica GDPR</Link> și sunt de acord
                ca datele mele să fie raportate către AEP, conform obligațiilor legale.
              </span>
            </label>
          </div>

          {error && <p className="rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm">{error}</p>}

          <div className="text-center">
            <button disabled={busy} className="btn-brand w-full py-4 text-lg disabled:opacity-60">
              {busy ? "Se pregătește plata…" : `Donează în siguranță cu cardul${amount >= 10 ? ` · ${amount} RON` : ""}`}
            </button>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <CardLogo label="VISA" />
              <CardLogo label="Mastercard" />
              <CardLogo label="EuPlătesc.ro" />
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-foreground/55">
            Datele cardului sunt introduse și procesate exclusiv pe pagina securizată EuPlătesc.ro, cu autentificare
            3D Secure. Partidul Verde nu primește și nu stochează datele cardului tău. Comision suplimentar pentru
            donator: 0%.
          </p>
        </form>
      </section>
    </Layout>
  );
}
