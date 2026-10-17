import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const EUPLATESC_URL = "https://secure.euplatesc.ro/tdsprocess/tranzactd.php";

/** EuPlătesc signature: each value prefixed by its byte length ("-" for empty), HMAC-MD5 with hex-decoded key. */
export function euplatescHash(values: string[], keyHex: string): string {
  const data = values
    .map((v) => (v === "" ? "-" : `${Buffer.byteLength(v, "utf8")}${v}`))
    .join("");
  return createHmac("md5", Buffer.from(keyHex, "hex")).update(data, "utf8").digest("hex").toUpperCase();
}

export function gmTimestamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
}

export function nonce(): string {
  return randomBytes(16).toString("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const x = Buffer.from(a.toUpperCase());
  const y = Buffer.from(b.toUpperCase());
  return x.length === y.length && timingSafeEqual(x, y);
}
