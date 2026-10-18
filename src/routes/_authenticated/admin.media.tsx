import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { canAccess, useMyRoles } from "@/lib/roles";
import { pageHead } from "@/lib/seo";

type MediaFile = { name: string; id: string | null; created_at: string | null; metadata: Record<string, unknown> | null };

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => pageHead("Bibliotecă media", "Imagini și documente PDF ale site-ului.", "/admin/media"),
  component: MediaLibrary,
});

function MediaLibrary() {
  const qc = useQueryClient();
  const { data: me, isLoading: rolesLoading } = useMyRoles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const list = useQuery({
    queryKey: ["media-files"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("media").list("", { limit: 200, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return (data ?? []).filter((f) => f.name !== ".emptyFolderPlaceholder") as MediaFile[];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const ok = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "application/pdf"];
      if (!ok.includes(file.type)) throw new Error("Sunt acceptate doar imagini (PNG, JPG, WebP, GIF, SVG) și fișiere PDF.");
      const path = `${Date.now()}-${file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (error) throw error;
    },
    onSuccess: () => { setErr(null); qc.invalidateQueries({ queryKey: ["media-files"] }); },
    onError: (e: Error) => setErr(e.message),
  });

  const remove = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.storage.from("media").remove([name]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["media-files"] }),
    onError: (e: Error) => alert(e.message),
  });

  const copyUrl = async (name: string) => {
    const { data, error } = await supabase.storage.from("media").createSignedUrl(name, 60 * 60 * 24 * 365);
    if (error || !data) return alert(error?.message ?? "Nu am putut genera adresa.");
    await navigator.clipboard.writeText(data.signedUrl);
    setCopied(name);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!rolesLoading && me && !canAccess(me.roles, "media")) {
    return <div className="glass rounded-2xl p-8">Nu ai acces la această secțiune.</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Bibliotecă media</h1>
        <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending} className="btn-brand px-4 py-2 text-sm">
          {upload.isPending ? "Se încarcă…" : "+ Încarcă fișier"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) upload.mutate(f); e.currentTarget.value = ""; }}
        />
      </div>
      <p className="mt-3 max-w-2xl text-sm text-foreground/60">
        Imagini și PDF-uri folosite în articole, comunicate și pagini. Butonul „Copiază adresa” îți dă linkul pe care îl lipești în câmpul „Adresă imagine” sau „Adresă PDF” al conținutului.
      </p>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.data?.map((f) => {
          const isImage = String(f.metadata?.['mimetype'] ?? "").startsWith("image/");
          return (
            <div key={f.name} className="glass rounded-xl p-4">
              <div className="grid h-32 place-items-center overflow-hidden rounded-lg bg-secondary text-xs text-foreground/50">
                {isImage ? <MediaThumb name={f.name} /> : "PDF"}
              </div>
              <p className="mt-3 truncate text-sm" title={f.name}>{f.name}</p>
              <p className="text-xs text-foreground/50">{f.created_at ? new Date(f.created_at).toLocaleDateString("ro-RO") : ""}</p>
              <div className="mt-3 flex gap-3 text-sm">
                <Button onClick={() => copyUrl(f.name)} className="text-accent hover:underline">{copied === f.name ? "Copiat!" : "Copiază adresa"}</Button>
                <Button onClick={() => confirm("Ștergi fișierul?") && remove.mutate(f.name)} className="text-destructive hover:underline">Șterge</Button>
              </div>
            </div>
          );
        })}
      </div>
      {list.data?.length === 0 && <p className="mt-6 text-foreground/50">Niciun fișier încărcat.</p>}
      {list.isLoading && <p className="mt-6 text-foreground/50">Se încarcă…</p>}
    </div>
  );
}

function MediaThumb({ name }: { name: string }) {
  const url = useQuery({
    queryKey: ["media-thumb", name],
    queryFn: async () => {
      const { data } = await supabase.storage.from("media").createSignedUrl(name, 3600);
      return data?.signedUrl ?? "";
    },
    staleTime: 3_000_000,
  });
  if (!url.data) return <span>…</span>;
  return <img src={url.data} alt={name} className="h-full w-full object-cover" />;
}
