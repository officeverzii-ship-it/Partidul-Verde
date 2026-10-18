/** Resend's Svix signature covers the exact raw body, event ID and timestamp. */
export async function verifyResendSignature(body: string, headers: Headers, secret: string | undefined, now = Date.now()): Promise<boolean> {
  if (!secret) return false;
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatures = headers.get('svix-signature');
  if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp) || Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  try {
    const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const payload = new TextEncoder().encode(`${id}.${timestamp}.${body}`);
    for (const entry of signatures.split(/\s+/)) {
      const [version, signature] = entry.split(',');
      if (version !== 'v1' || !signature) continue;
      const bytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      if (await crypto.subtle.verify('HMAC', key, bytes, payload)) return true;
    }
  } catch { return false; }
  return false;
}