export const PASSWORD_RECOVERY_URL = 'https://partidulverde.duckdns.org/reset-password';

// Cloud Auth can fall back to its managed Site URL for external hosting.
// Only forward recovery credentials to the explicitly chosen public site.
export function recoveryFallbackRedirect(origin: string, hash: string): string | null {
  if (origin !== 'https://partidulverde.lovable.app') return null;
  if (new URLSearchParams(hash.slice(1)).get('type') !== 'recovery') return null;
  return 'https://partidulverde.duckdns.org/reset-password' + hash;
}

// Run before the auth client loads so it cannot consume the recovery fragment
// on the fallback host. Never log or persist the fragment on that host.
export const recoveryFallbackScript = `(() => {
  const destination = (${recoveryFallbackRedirect.toString()})(window.location.origin, window.location.hash);
  if (destination) window.location.replace(destination);
})();`;