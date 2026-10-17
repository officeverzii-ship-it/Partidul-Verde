import { useState, type FormEvent, type ReactNode } from "react";

export function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "block sm:col-span-2" : "block"}>
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-foreground/50">
        {label}
      </span>
      {children}
    </label>
  );
}

const emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const phoneRe = /^[0-9+().\s-]{9,20}$/;

export type FormValues = Record<string, string>;

export function useSiteForm(
  required: string[],
  onValid?: (get: (key: string) => string) => Promise<string | null>,
) {
  const [values, setValues] = useState<FormValues>({});
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [lastAt, setLastAt] = useState(0);

  const set = (name: string) => (e: { currentTarget: { value: string } }) =>
    setValues((v) => ({ ...v, [name]: e.currentTarget.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sent) return;
    if (Date.now() - lastAt < 5000) {
      setError("Te rugăm să aștepți câteva secunde înainte de a retrimite.");
      return;
    }
    for (const key of required) {
      if (!values[key]?.trim()) {
        setError("Te rugăm să completezi toate câmpurile obligatorii.");
        return;
      }
    }
    if (values["email"] !== undefined && !emailRe.test(values["email"].trim())) {
      setError("Adresa de email nu pare validă.");
      return;
    }
    if (values["telefon"]?.trim() && !phoneRe.test(values["telefon"].trim())) {
      setError("Numărul de telefon nu pare valid.");
      return;
    }
    setLastAt(Date.now());
    if (onValid) {
      const err = await onValid((k) => (values[k] ?? "").trim());
      if (err) {
        setError(err);
        return;
      }
    }
    setError(null);
    setSent(true);
  };

  return { values, set, submit, error, sent };
}

export function FormStatus({ error, sent, message }: { error: string | null; sent: boolean; message: string }) {
  if (sent) {
    return (
      <p className="mt-4 rounded-xl border border-brand/40 bg-brand/15 px-4 py-3 text-sm">
        {message}
      </p>
    );
  }
  if (error) {
    return (
      <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/15 px-4 py-3 text-sm">
        {error}
      </p>
    );
  }
  return null;
}
