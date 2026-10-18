/** Encode untrusted text before placing it in HTML, including quoted attributes. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

/** Keep spreadsheet commands as literal text, including whitespace-prefixed payloads. */
export function csvCell(value: unknown): string {
  const raw = value == null ? '' : Array.isArray(value) ? value.join('; ') : String(value);
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(raw) || /^[\t\r\n]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}