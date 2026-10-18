import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/site/Layout";
import { Field } from "@/components/site/Form";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [
    { title: "Resetare parolă — Partidul Verde" },
    { name: "description", content: "Alege o parolă nouă pentru contul tău Partidul Verde." },
    { property: "og:title", content: "Resetare parolă — Partidul Verde" },
    { property: "og:description", content: "Recuperarea accesului la contul Partidul Verde." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [state, setState] = useState<"loading" | "ready" | "invalid" | "done">("loading");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const isRecovery = hash.get("type") === "recovery";
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && active) setState("ready");
    });
    if (isRecovery && !hash.has("error")) {
      supabase.auth.getUser().then(({ data: user, error }) => {
        if (active) setState(user.user && !error ? "ready" : "invalid");
      }).catch(() => { if (active) setState("invalid"); });
    } else {
      setState("invalid");
    }
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || state !== "ready") return;
    if (password !== confirmation) { setMessage("Parolele nu coincid."); return; }
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setMessage("Parola nu a putut fi schimbată. Verifică cerințele parolei sau solicită un link nou.");
      else {
        setPassword("");
        setConfirmation("");
        setState("done");
        await supabase.auth.signOut();
      }
    } catch { setMessage("Nu ne putem conecta. Încearcă din nou."); }
    finally { setBusy(false); }
  }

  return <Layout><section className="mx-auto max-w-md px-6 py-16">
    <form onSubmit={submit} className="glass rounded-3xl p-8">
      <h1 className="font-display text-3xl font-bold">Resetare parolă</h1>
      {state === "loading" && <p role="status" className="mt-4">Se verifică linkul…</p>}
      {state === "invalid" && <><p role="alert" className="mt-4">Linkul lipsește, a expirat sau nu este valid. Solicită un nou email de resetare.</p><Button asChild variant="link" className="mt-4 px-0"><Link to="/auth">Înapoi la autentificare</Link></Button></>}
      {state === "ready" && <><div className="mt-6 space-y-4">
        <Field label="Parolă nouă"><input type="password" autoComplete="new-password" minLength={8} required className="field" value={password} onChange={(e) => setPassword(e.currentTarget.value)} /></Field>
        <Field label="Confirmă parola"><input type="password" autoComplete="new-password" minLength={8} required className="field" value={confirmation} onChange={(e) => setConfirmation(e.currentTarget.value)} /></Field>
      </div><Button type="submit" className="btn-brand mt-6 w-full" disabled={busy}>{busy ? "Se salvează…" : "Salvează parola"}</Button></>}
      {state === "done" && <><p role="status" className="mt-4">Parola a fost schimbată. Te poți autentifica folosind parola nouă.</p><Button asChild className="mt-6 w-full"><Link to="/auth">Autentificare</Link></Button></>}
      {message && <p role="alert" className="mt-4 text-sm text-destructive">{message}</p>}
    </form>
  </section></Layout>;
}