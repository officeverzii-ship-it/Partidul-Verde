import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Layout } from "@/components/site/Layout";
import { Field } from "@/components/site/Form";

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
  const [mode, setMode] = useState<"in" | "up">("in");
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
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Email sau parolă incorecte.");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setMsg(error ? error.message : "Verifică emailul pentru a confirma contul.");
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setMsg("Autentificarea Google a eșuat.");
  };

  return (
    <Layout>
      <section className="mx-auto max-w-md px-6 py-16">
        <form onSubmit={submit} className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl font-bold">{mode === "in" ? "Autentificare" : "Cont nou"}</h1>
          <p className="mt-2 text-sm text-foreground/60">Acces la panoul intern al partidului.</p>
          <div className="mt-6 space-y-4">
            <Field label="Email"><input type="email" required className="field" value={email} onChange={(e) => setEmail(e.currentTarget.value)} /></Field>
            <Field label="Parolă"><input type="password" required minLength={8} className="field" value={password} onChange={(e) => setPassword(e.currentTarget.value)} /></Field>
          </div>
          <button disabled={busy} className="btn-brand mt-6 w-full py-3">{mode === "in" ? "Intră" : "Creează cont"}</button>
          <button type="button" onClick={google} className="glass mt-3 w-full rounded-xl py-3 font-semibold">Continuă cu Google</button>
          {msg && <p className="mt-4 text-sm text-accent">{msg}</p>}
          <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-foreground/60 hover:text-foreground">
            {mode === "in" ? "Nu ai cont? Creează unul" : "Ai deja cont? Intră"}
          </button>
        </form>
      </section>
    </Layout>
  );
}
