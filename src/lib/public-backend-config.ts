export type PublicBackendEnvironment = {
  SUPABASE_URL?: string | undefined;
  SUPABASE_PUBLISHABLE_KEY?: string | undefined;
  VITE_SUPABASE_URL?: string | undefined;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
};

// Accept values pasted from an environment file, without exposing them in errors.
function cleanValue(value: string | undefined, names: string[]) {
  let result = value?.trim() ?? '';
  for (const name of names) {
    if (result.startsWith(`${name}=`)) result = result.slice(name.length + 1).trim();
  }
  if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) {
    result = result.slice(1, -1).trim();
  }
  return result;
}

export function resolvePublicBackendConfig(env: PublicBackendEnvironment) {
  const url = cleanValue(env.SUPABASE_URL, ['SUPABASE_URL', 'VITE_SUPABASE_URL']) || cleanValue(env.VITE_SUPABASE_URL, ['VITE_SUPABASE_URL']);
  const key = cleanValue(env.SUPABASE_PUBLISHABLE_KEY, ['SUPABASE_PUBLISHABLE_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY']) || cleanValue(env.VITE_SUPABASE_PUBLISHABLE_KEY, ['VITE_SUPABASE_PUBLISHABLE_KEY']);
  if (!url || !key) throw new Error('Conexiunea la baza de date nu este configurată. Configurează SUPABASE_URL și SUPABASE_PUBLISHABLE_KEY la runtime în Coolify.');
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('SUPABASE_URL nu este o adresă HTTP/HTTPS validă. Introdu doar adresa bazei de date în Coolify.'); }
  if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new Error('SUPABASE_URL trebuie să fie adresa HTTP/HTTPS a bazei de date, fără cale, parametri sau date de autentificare.');
  }
  return { url: parsed.origin, key };
}