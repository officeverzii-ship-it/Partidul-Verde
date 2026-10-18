import { describe, expect, it } from 'vitest';
import { ACCOUNT_CONFIRMATION_URL, PASSWORD_RECOVERY_URL, recoveryFallbackRedirect, signupFallbackRedirect } from './password-recovery';

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

describe('account confirmation destination', () => {
  it('requests the DuckDNS public sign-in page', () => {
    expect(ACCOUNT_CONFIRMATION_URL).toBe('https://partidulverde.duckdns.org/auth');
  });
  it('forwards signup confirmation from the managed fallback with the fragment intact', () => {
    const hash = '#access_token=test-only&refresh_token=test-only&type=signup';
    expect(signupFallbackRedirect('https://partidulverde.lovable.app', hash)).toBe('https://partidulverde.duckdns.org/auth' + hash);
  });
  it('does not forward recovery, ordinary sign-ins, or empty visits as signup', () => {
    expect(signupFallbackRedirect('https://partidulverde.lovable.app', '#type=recovery')).toBeNull();
    expect(signupFallbackRedirect('https://partidulverde.lovable.app', '#type=magiclink')).toBeNull();
    expect(signupFallbackRedirect('https://partidulverde.lovable.app', '')).toBeNull();
  });
  it('never forwards signup credentials from DuckDNS or unrelated origins', () => {
    expect(signupFallbackRedirect('https://partidulverde.duckdns.org', '#type=signup')).toBeNull();
    expect(signupFallbackRedirect('https://example.org', '#type=signup')).toBeNull();
  });
});