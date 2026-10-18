import { describe, expect, it } from 'vitest';
import { csvCell, escapeHtml } from './output-safety';

describe('untrusted email text', () => {
  it('encodes markup and attribute delimiters', () => {
    expect(escapeHtml(`<a href="bad">O'Neil & Co</a>`)).toBe('&lt;a href=&quot;bad&quot;&gt;O&#39;Neil &amp; Co&lt;/a&gt;');
  });
  it('preserves Romanian text', () => expect(escapeHtml('Înscriere Ștefan')).toBe('Înscriere Ștefan'));
});
describe('spreadsheet exports', () => {
  for (const value of ['=1+1', '+cmd', '-cmd', '@SUM(A1)', '  =1', '\t=1', '\r=1', '\n=1']) {
    it(`neutralizes ${JSON.stringify(value)}`, () => expect(csvCell(value).replace(/^"/, '').startsWith("'")).toBe(true));
  }
  it('quotes delimiters and embedded quotes', () => expect(csvCell('a;"b"')).toBe('"a;""b"""'));
  it('handles arrays and empty values', () => { expect(csvCell(['=1','b'])).toBe('"\'=1; b"'); expect(csvCell(null)).toBe(''); });
});