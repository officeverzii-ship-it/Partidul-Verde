import { describe, expect, it } from 'vitest';
import { resolvePublicBackendConfig } from './public-backend-config';

describe('Coolify public backend configuration', () => {
  const publicConfig = { VITE_SUPABASE_URL: 'https://database.example.invalid', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test-value' };
  it('uses build-time public configuration when runtime values are absent', () => {
    expect(resolvePublicBackendConfig(publicConfig).url).toBe('https://database.example.invalid');
  });
  it('prefers an explicit runtime database over the build-time database', () => {
    expect(resolvePublicBackendConfig({ ...publicConfig, SUPABASE_URL: 'https://runtime.example.invalid' }).url).toBe('https://runtime.example.invalid');
  });
  it('accepts surrounding whitespace, quotes and an accidentally pasted assignment', () => {
    expect(resolvePublicBackendConfig({ ...publicConfig, SUPABASE_URL: ' SUPABASE_URL="https://runtime.example.invalid/" ' }).url).toBe('https://runtime.example.invalid');
  });
  it('rejects an invalid runtime URL instead of silently selecting another database', () => {
    expect(() => resolvePublicBackendConfig({ ...publicConfig, SUPABASE_URL: 'not-a-url' })).toThrow('SUPABASE_URL');
  });
  it('rejects credentials, paths and non-HTTP protocols', () => {
    for (const url of ['ftp://database.example.invalid', 'https://user:password@database.example.invalid', 'https://database.example.invalid/rest/v1']) {
      expect(() => resolvePublicBackendConfig({ ...publicConfig, SUPABASE_URL: url })).toThrow('SUPABASE_URL');
    }
  });
  it('rejects missing configuration', () => {
    expect(() => resolvePublicBackendConfig({})).toThrow('Configurează SUPABASE_URL');
  });
});