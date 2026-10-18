import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Layout } from "@/components/site/Layout";
import { Field } from "@/components/site/Form";
import { Button } from "@/components/ui/button";
import { PASSWORD_RECOVERY_URL } from "@/lib/password-recovery";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: "Autentificare — Partidul Verde" },
      { name: "description", content: "Intră în contul tău pentru a accesa panoul intern." },
      { property: "og:title", content: "Autentificare — Partidul Verde" },
      { property: "og:description", content: "Acces la panoul intern." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/admin" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "forgot") {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: PASSWORD_RECOVERY_URL,
        });
        setMsg(error ? "Linkul nu a putut fi trimis. Încearcă din nou mai târziu." : "Dacă există un cont cu această adresă, vei primi un email cu linkul pentru resetarea parolei. Verifică și folderul Spam.");
      } catch {
        setMsg("Nu ne putem conecta. Încearcă din nou.");
      }
    } else if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Email sau parolă incorecte.");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setMsg(error ? error.message : "Verifică emailul pentru a confirma contul.");
    }
    setBusy(false);
  };

  return (


    <Layout>
      <section className="mx-auto max-w-md px-6 py-16">
        <form onSubmit={submit} className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl font-bold">{mode === "in" ? "Autentificare" : mode === "forgot" ? "Recuperare parolă" : "Cont nou"}</h1>
          <p className="mt-2 text-sm text-foreground/60">Acces la panoul intern al partidului.</p>
          <div className="mt-6 space-y-4">
            <Field label="Email"><input type="email" required className="field" value={email} onChange={(e) => setEmail(e.currentTarget.value)} /></Field>
            {mode !== "forgot" && <Field label="Parolă"><input type="password" required minLength={8} className="field" value={password} onChange={(e) => setPassword(e.currentTarget.value)} /></Field>}
          </div>
          {mode === "in" && <Button type="button" variant="link" className="mt-2 px-0" onClick={() => { setMode("forgot"); setMsg(null); setPassword(""); }}>Ai uitat parola?</Button>}
          <Button type="submit" disabled={busy} className="btn-brand mt-6 w-full py-3">{busy ? "Se procesează…" : mode === "in" ? "Intră" : mode === "forgot" ? "Trimite link de resetare" : "Creează cont"}</Button>
          {msg && <p role="status" className="mt-4 text-sm text-foreground">{msg}</p>}

          <Button type="button" variant="link" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }} className="mt-6 px-0">
            {mode === "in" ? "Nu ai cont? Creează unul" : "Înapoi la autentificare"}
          </Button>
        </form>
      </section>
    </Layout>
  );
}
