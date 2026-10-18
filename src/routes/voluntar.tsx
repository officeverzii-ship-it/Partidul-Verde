import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/site/Layout";
import { Field, FormStatus, useSiteForm } from "@/components/site/Form";
import { useBranchOptions } from "@/components/admin/CrudPage";
import { useServerFn } from "@tanstack/react-start";
import { submitVolunteer } from "@/lib/crm.functions";

export const Route = createFileRoute("/voluntar")({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "Devino voluntar — Partidul Verde" },
      { name: "description", content: "Implică-te ca voluntar în acțiunile Partidului Verde din orașul tău." },
      { property: "og:title", content: "Devino voluntar — Partidul Verde" },
      { property: "og:description", content: "Implică-te în acțiunile locale." },
    ],
  }),
  component: Voluntar,
});

function Voluntar() {
  const { data: branches = [] } = useBranchOptions();
  const sendVolunteer = useServerFn(submitVolunteer);
  const f = useSiteForm(["nume", "email", "telefon", "disponibilitate", "consimtamant"], async (v) => {
    if (v("consimtamant") !== "da") return "Trebuie să îți dai acordul pentru prelucrarea datelor.";
    try {
      await sendVolunteer({
        data: {
          full_name: v("nume"), email: v("email"), phone: v("telefon"),
          availability: v("disponibilitate"), branch_id: v("filiala") || "", skills: v("competente") || "",
          gdpr_consent: true,
        },
      });
      return null;
    } catch {
      return "Nu am putut trimite formularul. Verifică datele și încearcă din nou.";
    }
  });
  return (
    <Layout>
      <PageHeader eyebrow="Voluntariat" title={<>Timpul tău <span className="text-brand">contează</span>.</>} lead="Plantări, campanii, evenimente, comunicare — alege ce ți se potrivește." />
      <section className="mx-auto max-w-3xl px-6 py-8">
        <form onSubmit={f.submit} className="glass rounded-3xl p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nume complet *"><input className="field" maxLength={100} onChange={f.set("nume")} /></Field>
            <Field label="Email *"><input type="email" className="field" maxLength={255} onChange={f.set("email")} /></Field>
            <Field label="Telefon *"><input type="tel" className="field" maxLength={20} onChange={f.set("telefon")} /></Field>
            <Field label="Disponibilitate *">
              <select className="field" defaultValue="" onChange={f.set("disponibilitate")}>
                <option value="" disabled>Alege</option>
                <option>Weekend</option><option>Seara</option><option>Flexibil</option>
              </select>
            </Field>
            <Field label="Filiala preferată" full>
              <select className="field" defaultValue="" onChange={f.set("filiala")}>
                <option value="">Oricare</option>
                {branches.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </Field>
            <Field label="Competențe" full><textarea rows={3} className="field" maxLength={500} onChange={f.set("competente")} /></Field>
          </div>
          <label className="mt-5 flex items-start gap-3 text-sm text-foreground/70">
            <input type="checkbox" className="mt-1" onChange={(e) => f.set("consimtamant")({ currentTarget: { value: e.currentTarget.checked ? "da" : "" } })} />
            <span>Îmi dau acordul ca datele introduse să fie prelucrate de Partidul Verde pentru organizarea activităților de voluntariat, conform <a href="/confidentialitate" className="text-accent underline">Politicii de confidențialitate</a>. *</span>
          </label>
          <button className="btn-brand mt-6 px-6 py-3">Trimite</button>
          <FormStatus error={f.error} sent={f.sent} message="Mulțumim! Coordonatorul de voluntari te va contacta." />
        </form>
      </section>
    </Layout>
  );
}
