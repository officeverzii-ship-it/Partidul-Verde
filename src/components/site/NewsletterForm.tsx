import { useState, type FormEvent } from "react";
import { subscribeNewsletter } from "@/lib/email.functions";

export function NewsletterForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    setErr(null);
    const fd = new FormData(e.currentTarget);
    try {
      await subscribeNewsletter({
        data: {
          full_name: String(fd.get("full_name") ?? ""),
          email: String(fd.get("email") ?? ""),
          consent: fd.get("consent") === "on",
        },
      });
      setState("ok");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "A apărut o eroare.");
      setState("err");
    }
  };

  if (state === "ok") {
    return <p className="text-sm text-accent">Verifică-ți emailul — ți-am trimis un link de confirmare (dublă confirmare).</p>;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <input name="full_name" required minLength={2} maxLength={100} placeholder="Nume și prenume" className="field" />
      <input name="email" type="email" required maxLength={255} placeholder="adresa@email.ro" className="field" />
      <label className="flex items-start gap-2 text-xs text-foreground/60">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>Sunt de acord să primesc newsletterul Partidului Verde. Mă pot dezabona oricând. Vezi <a href="/confidentialitate" className="underline">Politica de confidențialitate</a>.</span>
      </label>
      <button disabled={state === "sending"} className="btn-brand rounded-lg px-4 py-2 text-sm">
        {state === "sending" ? "Se trimite…" : "Abonează-mă"}
      </button>
      {state === "err" && err && <p className="text-xs text-destructive">{err}</p>}
    </form>
  );
}
