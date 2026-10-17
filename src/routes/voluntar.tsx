import { createFileRoute } from "@tanstack/react-router";
import { Layout, PageHeader } from "@/components/site/Layout";
import { Field, FormStatus, useSiteForm } from "@/components/site/Form";
import { supabase } from "@/integrations/supabase/client";
import { useBranchOptions } from "@/components/admin/CrudPage";

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
  const f = useSiteForm(["nume", "email", "telefon", "disponibilitate"], async (v) => {
    const { error } = await supabase.from("volunteers").insert({
      full_name: v("nume"), email: v("email"), phone: v("telefon"),
      availability: v("disponibilitate"), branch_id: v("filiala") || null, skills: v("competente") || null,
    });
    return error ? "Nu am putut trimite formularul. Încearcă din nou." : null;
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
          <button className="btn-brand mt-6 px-6 py-3">Trimite</button>
          <FormStatus error={f.error} sent={f.sent} message="Mulțumim! Coordonatorul de voluntari te va contacta." />
        </form>
      </section>
    </Layout>
  );
}
