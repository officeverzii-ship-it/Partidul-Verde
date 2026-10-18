import { describe, expect, it } from 'vitest';
import { verifyResendSignature } from './resend-signature.server';

describe('Resend callback authentication', () => {
  const secret = `whsec_${btoa('test-only-signing-key')}`;
  const body = '{"type":"email.delivered"}';
  const now = 1792347000000;
  async function signed() {
    const timestamp = String(now / 1000);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode('test-only-signing-key'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`event-id.${timestamp}.${body}`));
    return new Headers({ 'svix-id': 'event-id', 'svix-timestamp': timestamp, 'svix-signature': `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}` });
  }
  it('accepts authentic payloads', async () => expect(await verifyResendSignature(body, await signed(), secret, now)).toBe(true));
  it('rejects altered bodies', async () => expect(await verifyResendSignature(body+' ', await signed(), secret, now)).toBe(false));
  it('rejects old payloads', async () => expect(await verifyResendSignature(body, await signed(), secret, now+301000)).toBe(false));
  it('rejects missing credentials', async () => { expect(await verifyResendSignature(body, new Headers(), secret, now)).toBe(false); expect(await verifyResendSignature(body, await signed(), undefined, now)).toBe(false); });
});