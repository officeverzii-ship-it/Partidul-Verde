import { describe, expect, it } from 'vitest';
import { PASSWORD_RECOVERY_URL, recoveryFallbackRedirect } from './password-recovery';

describe('password recovery destination', () => {
  it('requests the DuckDNS password reset page', () => {
    expect(PASSWORD_RECOVERY_URL).toBe('https://partidulverde.duckdns.org/reset-password');
  });
  it('forwards recovery from the managed fallback to DuckDNS with its fragment intact', () => {
    const hash = '#access_token=test-only&refresh_token=test-only&type=recovery';
    expect(recoveryFallbackRedirect('https://partidulverde.lovable.app', hash)).toBe('https://partidulverde.duckdns.org/reset-password' + hash);
  });
  it('does not redirect ordinary sign-ins or visits', () => {
    expect(recoveryFallbackRedirect('https://partidulverde.lovable.app', '#type=signup')).toBeNull();
    expect(recoveryFallbackRedirect('https://partidulverde.lovable.app', '')).toBeNull();
  });
  it('does not redirect on DuckDNS or unrelated origins', () => {
    expect(recoveryFallbackRedirect('https://partidulverde.duckdns.org', '#type=recovery')).toBeNull();
    expect(recoveryFallbackRedirect('https://example.org', '#type=recovery')).toBeNull();
  });
});