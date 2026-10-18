import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { resolvePublicBackendConfig } from './public-backend-config';

export function createPublicBackendClient() {
  const { url, key } = resolvePublicBackendConfig({
    SUPABASE_URL: process.env['SUPABASE_URL'],
    SUPABASE_PUBLISHABLE_KEY: process.env['SUPABASE_PUBLISHABLE_KEY'],
    VITE_SUPABASE_URL: import.meta.env['VITE_SUPABASE_URL'],
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'],
  });
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
}