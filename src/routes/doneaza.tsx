import { Button } from "@/components/ui/button";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Leaf, ShieldCheck } from "lucide-react";
import { getCampaignProgress } from "@/lib/campaign.functions";
import { campaignPercent } from "@/lib/module-rules";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Layout } from "@/components/site/Layout";
import { Field } from "@/components/site/Form";
import { isAdultCnp, isValidCnp } from "@/lib/cnp";
import { createDonationCheckout } from "@/lib/payments.functions";
import { getStripe, getStripeEnvironment, isTestMode } from "@/lib/stripe";

const campaignOptions = queryOptions({ queryKey: ["campaign-progress"], queryFn: () => getCampaignProgress() });

export const Route = createFileRoute("/doneaza")({
  validateSearch: z.object({ status: z.enum(["succes", "esuat"]).optional() }),
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "Donează — Partidul Verde" },
      {
        name: "description",
        content: "Susține Partidul Verde printr-o donație securizată cu cardul, unică sau lunară, conformă Legii 334/2006.",
      },
      { property: "og:title", content: "Susține viziunea noastră pentru România — Partidul Verde" },
      { property: "og:description", content: "Donație securizată cu cardul, unică sau lunară, conformă Legii 334/2006." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(campaignOptions),
  errorComponent: () => <Layout><p role="alert" className="content-width py-12">Donațiile nu au putut fi încărcate. Reîncearcă.</p></Layout>,
  notFoundComponent: () => <p>Pagina nu este disponibilă.</p>,
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

function TestModeBanner() {
  if (!isTestMode()) return null;
  return (
    <div className="w-full border-b border-accent/40 bg-accent/20 px-4 py-2 text-center text-sm text-foreground">
      Plățile din această versiune sunt în mod de test — nu se debitează bani reali.
    </div>
  );
}

function Doneaza() {
  const { status } = Route.useSearch();
  const { data: campaign } = useSuspenseQuery(campaignOptions);
  const [step, setStep] = useState(1);
  const start = useServerFn(createDonationCheckout);
  const [preset, setPreset] = useState<number | null>(100);
  const [custom, setCustom] = useState("");
  const [donationType, setDonationType] = useState<"unic" | "lunar">("unic");
  const [v, setV] = useState<Record<string, string>>({});
  const [citizenship, setCitizenship] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const amount = custom ? Number(custom.replace(",", ".")) : preset ?? 0;
  const set = (k: string) => (e: { currentTarget: { value: string } }) => {
    const value = e.currentTarget.value;
    setV((s) => ({ ...s, [k]: value }));
  };
  const val = (k: string) => (v[k] ?? "").trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      if (!Number.isFinite(amount) || amount < 10 || amount > 100000) return setError("Alege o sumă între 10 și 100.000 RON.");
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setError('Autentifică-te și solicită verificarea identității înainte de plată.');
      setStep(2); return;
    }
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
          donationType,
          fullName: val("fullName"),
          cnp: val("cnp"),
          street: val("street"),
          city: val("city"),
          county: val("county"),
          email: val("email"),
          phone: val("phone"),
          citizenship: true,
          terms: true,
          environment: getStripeEnvironment(),
        },
      });
      if ("error" in res) {
        setError(res.error);
        setBusy(false);
        return;
      }
      setClientSecret(res.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datele nu au putut fi validate. Verifică formularul.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <TestModeBanner />
      <section className="mx-auto max-w-3xl px-6 pt-14 pb-6 text-center">
        <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">
          Donează pentru <span className="text-brand">Partidul Verde</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/70">
          Fiecare donație finanțează campanii pentru aer curat, energie verde și comunități implicate. Transparent și legal.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Plata necesită un cont autentificat și identitatea verificată de organizație. <Link to="/auth" className="text-brand underline">Autentifică-te</Link> sau <Link to="/contact" className="text-brand underline">solicită verificarea identității</Link>.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Badge>Plăți securizate cu cardul</Badge>
          <Badge>Donație unică sau lunară</Badge>
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

      {campaign && <section className="mx-auto max-w-3xl px-6 pt-6" aria-label="Progres campanie"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-sm text-primary"><Leaf size={16} /> Campanie verde</p><h2 className="mt-1 text-xl font-bold">{campaign.title}</h2></div><p className="text-sm"><strong>{campaign.total.toLocaleString("ro-RO")} RON</strong> / {campaign.goal.toLocaleString("ro-RO")} RON</p></div><div role="progressbar" aria-label={campaign.title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={campaignPercent(campaign.total, campaign.goal)} className="mt-4 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${campaignPercent(campaign.total, campaign.goal)}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{campaign.count} donații confirmate · Exclusiv plăți reale în RON, începând cu {new Date(campaign.since).toLocaleDateString("ro-RO")}</p></section>}
      <section className="mx-auto max-w-3xl px-6 py-8">
        {clientSecret ? (
          <div className="glass rounded-3xl p-4 sm:p-6">
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : (
        <form onSubmit={submit} className="space-y-8 border-t border-border pt-6" noValidate>
          <ol className="flex flex-wrap items-center gap-5 border-b border-border pb-4 text-sm"><li className={step === 1 ? "font-bold text-primary" : "text-muted-foreground"}>1 · Sumă</li><li className={step === 2 ? "font-bold text-primary" : "text-muted-foreground"}>2 · Date și declarații</li><li className="text-muted-foreground">3 · Plata securizată</li></ol>
          <div hidden={step !== 1}>
            <h2 className="font-display text-xl font-semibold">1. Alege tipul și suma</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => setDonationType("unic")}
                variant={donationType === "unic" ? "default" : "outline"}
                aria-pressed={donationType === "unic"}
              >
                Donație unică
              </Button>
              <Button
                type="button"
                onClick={() => setDonationType("lunar")}
                variant={donationType === "lunar" ? "default" : "outline"}
                aria-pressed={donationType === "lunar"}
              >
                Donație lunară
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {presets.map((p) => (
                <Button
                  type="button"
                  key={p}
                  onClick={() => { setPreset(p); setCustom(""); }}
                  aria-pressed={!custom && preset === p}
                  className={`h-auto min-h-24 flex-col whitespace-normal p-4 ${!custom && preset === p ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-secondary"}`}
                >
                  <span className="font-bold">{p} RON</span>
                  {campaign?.impacts?.[String(p)] && <span className="mt-2 block text-xs font-normal leading-relaxed">{campaign.impacts[String(p)]}</span>}
                </Button>
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
            {donationType === "lunar" && (
              <p className="mt-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground/80">
                Suma aleasă va fi donată automat în fiecare lună. Poți anula oricând scriindu-ne pe email.
              </p>
            )}
          </div>

          <div hidden={step !== 2}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><p className="font-bold">{amount} RON{donationType === "lunar" ? " / lună" : ""}</p><Button type="button" variant="outline" onClick={() => { setStep(1); setError(null); }}><ArrowLeft size={16} /> Modifică suma</Button></div>
            <h2 className="font-display text-xl font-semibold">2. Datele donatorului</h2>
            <p className="mt-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground/80">
              Conform Legii 334/2006, partidele au obligația de a identifica donatorii și de a raporta donațiile către
              Autoritatea Electorală Permanentă (AEP). Datele sunt folosite exclusiv în acest scop.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nume complet" full><input className="field" maxLength={100} autoComplete="name" onChange={set("fullName")} /></Field>
              <Field label="CNP">
                <input className="field" inputMode="numeric" maxLength={13} value={v["cnp"] ?? ""} onChange={(e) => { const cnp = e.currentTarget.value.replace(/\D/g, ""); setV((s) => ({ ...s, cnp })); }} />
              </Field>
              <Field label="Telefon"><input type="tel" className="field" maxLength={20} autoComplete="tel" onChange={set("phone")} /></Field>
              <Field label="Stradă, număr, bloc, apartament" full><input className="field" maxLength={200} autoComplete="street-address" onChange={set("street")} /></Field>
              <Field label="Localitate"><input className="field" maxLength={80} autoComplete="address-level2" onChange={set("city")} /></Field>
              <Field label="Județ"><input className="field" maxLength={40} autoComplete="address-level1" onChange={set("county")} /></Field>
              <Field label="Email" full><input type="email" className="field" maxLength={255} autoComplete="email" onChange={set("email")} /></Field>
            </div>
          </div>

          <div hidden={step !== 2} className="space-y-4">
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
            <Button disabled={busy} className="h-auto w-full whitespace-normal py-4 text-base disabled:opacity-60">
              {step === 1 ? <ArrowRight size={18} /> : <ShieldCheck size={18} />}
              {busy ? "Se pregătește plata…" : step === 1 ? "Continuă cu datele donatorului" : `Donează în siguranță cu cardul${amount >= 10 ? ` · ${amount} RON${donationType === "lunar" ? "/lună" : ""}` : ""}`}
            </Button>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <CardLogo label="VISA" />
              <CardLogo label="Mastercard" />
            </div>
          </div>

          <p className="text-center text-xs leading-relaxed text-foreground/55">
            Datele cardului sunt introduse și procesate exclusiv de procesatorul de plăți securizat, cu autentificare
            3D Secure. Partidul Verde nu primește și nu stochează datele cardului tău. Comision suplimentar pentru
            donator: 0%.
          </p>
        </form>
        )}
      </section>
    </Layout>
  );
}
