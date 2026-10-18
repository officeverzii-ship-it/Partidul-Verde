import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { roleLabels, useMyRoles, type AppRole } from '@/lib/roles';
import { accessRoles, accessSchema } from '@/lib/access-schema';
import { pageHead } from '@/lib/seo';
import { DonorIdentityVerification } from '@/components/admin/DonorIdentityVerification';

export const Route = createFileRoute('/_authenticated/admin/access')({
  head: () => pageHead('Utilizatori și acces', 'Gestionarea securizată a rolurilor Partidului Verde.', '/admin/access'),
  component: AccessPage,
});

type AccessData = {
  users: { id: string; email: string; roles: { id: string; role: AppRole; branch_id: string | null }[] }[];
  count: number;
  branches: { id: string; name: string; county: string }[];
};

function AccessPage() {
  const qc = useQueryClient();
  const { data: me, isLoading } = useMyRoles();
  const allowed = me?.roles.includes('admin_national') ?? false;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AppRole>('editor');
  const [branchId, setBranchId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const list = useQuery({
    queryKey: ['admin-access', search, page], enabled: allowed,
    queryFn: async () => {
      const result = await supabase.rpc('admin_access_list', { _search: search, _page: page });
      if (result.error) throw result.error;
      return result.data as unknown as AccessData;
    },
  });
  const change = useMutation({
    mutationFn: async (value: { email: string; role: AppRole; branchId: string | null; remove: boolean }) => {
      const { error } = await supabase.rpc('admin_access_change', {
        _email: value.email, _role: value.role, ...(value.branchId ? { _branch_id: value.branchId } : {}), _remove: value.remove,
      });
      if (error) throw error;
    },
    onSuccess: (_, value) => {
      setError(''); setMessage(value.remove ? 'Rolul a fost retras.' : 'Accesul a fost salvat.');
      qc.invalidateQueries({ queryKey: ['admin-access'] });
      qc.invalidateQueries({ queryKey: ['my-roles'] });
    },
    onError: (e: Error) => { setMessage(''); setError(e.message); },
  });
  function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setMessage('');
    const parsed = accessSchema.safeParse({ email, role, branchId: role === 'admin_filiala' ? branchId || null : null });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? 'Date invalide.'); return; }
    if (role === 'admin_national' && !window.confirm('Acorzi acces complet de Admin Național acestui cont?')) return;
    change.mutate({ ...parsed.data, remove: false });
  }
  if (isLoading) return <p>Se încarcă…</p>;
  if (!allowed) return <p role="alert">Acces permis doar Adminului Național.</p>;
  const pages = Math.max(1, Math.ceil((list.data?.count ?? 0) / 20));
  return <div>
    <h1 className="flex items-center gap-3 font-display text-3xl font-bold"><ShieldCheck className="size-7 shrink-0 text-brand" />Utilizatori și acces</h1>
    <form onSubmit={submit} className="mt-6 grid gap-4 border-b border-border pb-6 sm:grid-cols-2">
      <label className="block"><span className="mb-2 block text-sm">Emailul contului existent</span><input className="field" type="email" required maxLength={255} value={email} onChange={e => setEmail(e.currentTarget.value)} /></label>
      <label className="block"><span className="mb-2 block text-sm">Rol</span><select aria-label="Rol" className="field" value={role} onChange={e => { setRole(e.currentTarget.value as AppRole); setBranchId(''); }}>{accessRoles.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}</select></label>
      {role === 'admin_filiala' && <label className="block"><span className="mb-2 block text-sm">Filială</span><select className="field" required value={branchId} onChange={e => setBranchId(e.currentTarget.value)}><option value="">Selectează filiala</option>{list.data?.branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.county}</option>)}</select></label>}
      <div className="flex items-end"><Button disabled={change.isPending || list.isLoading} className="btn-brand">Salvează accesul</Button></div>
    </form>
    {message && <p role="status" className="mt-4 text-brand">{message}</p>}
    {(error || list.error) && <p role="alert" className="mt-4 text-destructive">{error || list.error?.message}</p>}
    <label className="mt-6 block max-w-sm"><span className="mb-2 block text-sm">Caută după email</span><input className="field" type="search" maxLength={100} value={search} onChange={e => { setSearch(e.currentTarget.value); setPage(0); }} /></label>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-border"><th className="px-3 py-3">Cont</th><th className="px-3 py-3">Roluri și filiale</th></tr></thead><tbody>
      {list.data?.users.map(u => <tr key={u.id} className="border-b border-border"><td className="max-w-64 break-words px-3 py-4">{u.email}</td><td className="px-3 py-4"><div className="grid gap-2">{u.roles.length === 0 && <span className="text-muted-foreground">Fără rol atribuit</span>}{u.roles.map(r => <div key={r.id} className="flex items-center justify-between gap-3"><span>{roleLabels[r.role]}{r.branch_id && ` — ${list.data?.branches.find(b => b.id === r.branch_id)?.name ?? 'Filială'}`}</span><Button type="button" variant="ghost" size="icon" title={`Retrage ${roleLabels[r.role]}`} aria-label={`Retrage ${roleLabels[r.role]} pentru ${u.email}`} disabled={change.isPending || (r.role === 'admin_national' && u.email === me?.email)} onClick={() => { if (window.confirm(`Retragi rolul ${roleLabels[r.role]} pentru ${u.email}?`)) change.mutate({ email: u.email, role: r.role, branchId: null, remove: true }); }}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div></td></tr>)}
      {list.isLoading && <tr><td colSpan={2} className="py-6">Se încarcă…</td></tr>}
      {list.data?.users.length === 0 && <tr><td colSpan={2} className="py-6">Niciun cont găsit.</td></tr>}
    </tbody></table></div>
    <div className="mt-4 flex items-center justify-end gap-3"><Button variant="outline" aria-label="Pagina precedentă" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</Button><span>{page + 1} / {pages}</span><Button variant="outline" aria-label="Pagina următoare" disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>→</Button></div>
    <DonorIdentityVerification />
  </div>;
}